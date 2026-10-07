/**
 * Architecture rules of `echo_backend`, checked by `npm run arch:check`.
 * See docs/architecture.md for the conventions these rules enforce.
 */

import type { IConfiguration } from 'dependency-cruiser'

const MODULES = '^src/modules'
const SHARED = '^src/shared'
const TESTS = '(^|/)(__tests__|__test__)/|\\.test\\.tsx?$'

/** Layers that sit above `utils/` and `*.schemas.ts` and must never be imported by them. */
const UPPER_LAYERS = `${MODULES}/[^/]+/[^/]+\\.(routes|controller|service|repository)\\.ts$`

/**
 * Folders of one layer of a module split into `domain/`, `application/`, `infra/` and
 * `presentation/`, and of its submodules (`modules/logs/modules/selfLog/`).
 */
const layer = (names: string): string[] => [
  `${MODULES}/[^/]+/(${names})/`,
  `${MODULES}/[^/]+/modules/[^/]+/(${names})/`
]

const config: IConfiguration = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies make code hard to reason about and to test.',
      from: {},
      to: { circular: true }
    },

    // ── shared/ is a leaf: it never depends on domain modules ──────────────
    {
      name: 'backend-shared-not-to-modules',
      severity: 'error',
      comment: 'src/shared must not import from modules/.',
      from: { path: SHARED, pathNot: TESTS },
      to: { path: MODULES }
    },

    // ── modules are isolated from each other ───────────────────────────────
    {
      name: 'backend-modules-isolated',
      severity: 'error',
      comment:
        'A backend module may only import another module through auth.hooks (the shared authentication pre-handler).',
      from: { path: `${MODULES}/([^/]+)/`, pathNot: TESTS },
      to: {
        path: `${MODULES}/`,
        pathNot: [`${MODULES}/$1/`, `${MODULES}/auth/auth\\.hooks\\.ts$`]
      }
    },

    // ── layered modules: presentation → application → domain ← infra ───────
    {
      name: 'backend-domain-is-independent',
      severity: 'error',
      comment:
        'domain/ holds the models and the contracts the other layers build on, it depends on none of them.',
      from: { path: layer('domain'), pathNot: TESTS },
      to: { path: layer('application|infra|presentation') }
    },
    {
      name: 'backend-application-not-to-outer-layers',
      severity: 'error',
      comment:
        'application/ reaches the storage through the contracts of domain/, never through infra/, and does not know the routes.',
      from: { path: layer('application'), pathNot: TESTS },
      to: { path: layer('infra|presentation') }
    },
    {
      name: 'backend-infra-only-to-domain',
      severity: 'error',
      comment: 'infra/ implements the contracts of domain/ and knows nothing of the layers above.',
      from: { path: layer('infra'), pathNot: TESTS },
      to: { path: layer('application|presentation') }
    },
    {
      name: 'backend-presentation-not-to-infra',
      severity: 'error',
      comment: 'presentation/ talks to application/, never directly to infra/.',
      from: { path: layer('presentation'), pathNot: TESTS },
      to: { path: layer('infra') }
    },

    // ── flat modules: routes → controller → service → repository ───────────
    {
      name: 'backend-controller-not-to-routes',
      severity: 'error',
      from: { path: `${MODULES}/[^/]+/[^/]+\\.controller\\.ts$` },
      to: { path: `${MODULES}/[^/]+/[^/]+\\.routes\\.ts$` }
    },
    {
      name: 'backend-service-not-upward',
      severity: 'error',
      comment: 'Services must not depend on controllers or routes.',
      from: { path: `${MODULES}/[^/]+/[^/]+\\.service\\.ts$` },
      to: { path: `${MODULES}/[^/]+/[^/]+\\.(controller|routes)\\.ts$` }
    },
    {
      name: 'backend-repository-not-upward',
      severity: 'error',
      comment:
        'Repositories must only know about data access, not services, controllers or routes.',
      from: { path: `${MODULES}/[^/]+/[^/]+\\.repository\\.ts$` },
      to: { path: `${MODULES}/[^/]+/[^/]+\\.(service|controller|routes)\\.ts$` }
    },
    {
      name: 'backend-routes-not-to-service',
      severity: 'error',
      comment: 'Routes talk to controllers, never directly to services or repositories.',
      from: { path: `${MODULES}/[^/]+/[^/]+\\.routes\\.ts$`, pathNot: TESTS },
      to: { path: `${MODULES}/[^/]+/[^/]+\\.(service|repository)\\.ts$` }
    },
    {
      name: 'backend-controller-not-to-repository',
      severity: 'error',
      comment: 'Controllers talk to services, never directly to repositories.',
      from: { path: `${MODULES}/[^/]+/[^/]+\\.controller\\.ts$`, pathNot: TESTS },
      to: { path: `${MODULES}/[^/]+/[^/]+\\.repository\\.ts$` }
    },
    {
      name: 'backend-utils-and-schemas-are-leaves',
      severity: 'error',
      comment:
        'utils/ and *.schemas.ts are pure helpers and must not import routes/controllers/services/repositories. utils/ may sit directly under a module (modules/logs/utils/) or one level deeper, inside a sub-feature folder (modules/logs/cron/utils/).',
      from: {
        path: [
          `${MODULES}/[^/]+/utils/`,
          `${MODULES}/[^/]+/[^/]+/utils/`,
          `${MODULES}/[^/]+/[^/]+\\.schemas\\.ts$`
        ],
        pathNot: TESTS
      },
      to: { path: UPPER_LAYERS }
    },

    // ── package boundaries ─────────────────────────────────────────────────
    {
      name: 'backend-frontend-independent',
      severity: 'error',
      comment: 'Backend and frontend share code only through @echo/utilities.',
      from: { pathNot: TESTS },
      to: { path: '(^|/)echo_frontend/' }
    },
    {
      name: 'utilities-only-through-barrel',
      severity: 'error',
      comment:
        'Import from "@echo/utilities", never reach into echo_utilities by path (package-path deep imports are already blocked by its "exports" field).',
      from: {},
      to: { path: '(^|/)echo_utilities/(?!dist/index\\.js$|package\\.json$)' }
    },
    {
      name: 'generated-only-inside-utilities',
      severity: 'error',
      comment: '__generated__ files are exposed through the @echo/utilities barrel only.',
      from: {},
      to: { path: '__generated__' }
    },

    // ── production code vs tests ───────────────────────────────────────────
    {
      name: 'prod-not-to-tests',
      severity: 'error',
      comment: 'Production code must not import test files or test helpers.',
      from: { pathNot: TESTS },
      to: { path: TESTS }
    }
  ],

  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['/dist/', '/coverage/'] },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types']
    },
    reporterOptions: { text: { highlightFocused: true } }
  }
}

export default config

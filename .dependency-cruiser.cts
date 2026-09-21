/**
 * Architecture rules, checked by `npm run arch:check`.
 * See docs/architecture.md for the conventions these rules enforce.
 */

import type { IConfiguration } from 'dependency-cruiser'

const BACKEND = '^echo_backend/src'
const FRONTEND = '^echo_frontend/src'
const TESTS = '(^|/)(__tests__|__test__)/|\\.test\\.tsx?$'

/** Backend layers that sit above `utils/` and `*.schemas.ts` and must never be imported by them. */
const BACKEND_UPPER_LAYERS = `${BACKEND}/modules/[^/]+/[^/]+\\.(routes|controller|service|repository)\\.ts$`

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
      comment: 'echo_backend/src/shared must not import from modules/.',
      from: { path: `${BACKEND}/shared`, pathNot: TESTS },
      to: { path: `${BACKEND}/modules` }
    },
    {
      name: 'frontend-shared-not-to-modules',
      severity: 'error',
      comment: 'echo_frontend/src/shared must not import from modules/.',
      from: { path: `${FRONTEND}/shared`, pathNot: TESTS },
      to: { path: `${FRONTEND}/modules` }
    },

    // ── modules are isolated from each other ───────────────────────────────
    {
      name: 'backend-modules-isolated',
      severity: 'error',
      comment:
        'A backend module may only import another module through auth.hooks (the shared authentication pre-handler).',
      from: { path: `${BACKEND}/modules/([^/]+)/`, pathNot: TESTS },
      to: {
        path: `${BACKEND}/modules/`,
        pathNot: [`${BACKEND}/modules/$1/`, `${BACKEND}/modules/auth/auth\\.hooks\\.ts$`]
      }
    },
    {
      name: 'frontend-modules-isolated',
      severity: 'error',
      comment: 'A frontend module must not import from another module.',
      from: { path: `${FRONTEND}/modules/([^/]+)/`, pathNot: TESTS },
      to: { path: `${FRONTEND}/modules/`, pathNot: `${FRONTEND}/modules/$1/` }
    },
    {
      name: 'modules-not-to-app-entry',
      severity: 'error',
      comment: 'Modules and shared code must not import the app entry points.',
      from: { path: `${FRONTEND}/(modules|shared)/`, pathNot: TESTS },
      to: { path: `${FRONTEND}/(App|main)\\.tsx$` }
    },

    // ── backend layering: routes → controller → service → repository ───────
    {
      name: 'backend-controller-not-to-routes',
      severity: 'error',
      from: { path: `${BACKEND}/modules/[^/]+/[^/]+\\.controller\\.ts$` },
      to: { path: `${BACKEND}/modules/[^/]+/[^/]+\\.routes\\.ts$` }
    },
    {
      name: 'backend-service-not-upward',
      severity: 'error',
      comment: 'Services must not depend on controllers or routes.',
      from: { path: `${BACKEND}/modules/[^/]+/[^/]+\\.service\\.ts$` },
      to: { path: `${BACKEND}/modules/[^/]+/[^/]+\\.(controller|routes)\\.ts$` }
    },
    {
      name: 'backend-repository-not-upward',
      severity: 'error',
      comment: 'Repositories must only know about data access, not services, controllers or routes.',
      from: { path: `${BACKEND}/modules/[^/]+/[^/]+\\.repository\\.ts$` },
      to: { path: `${BACKEND}/modules/[^/]+/[^/]+\\.(service|controller|routes)\\.ts$` }
    },
    {
      name: 'backend-routes-not-to-service',
      severity: 'error',
      comment: 'Routes talk to controllers, never directly to services or repositories.',
      from: { path: `${BACKEND}/modules/[^/]+/[^/]+\\.routes\\.ts$`, pathNot: TESTS },
      to: { path: `${BACKEND}/modules/[^/]+/[^/]+\\.(service|repository)\\.ts$` }
    },
    {
      name: 'backend-controller-not-to-repository',
      severity: 'error',
      comment: 'Controllers talk to services, never directly to repositories.',
      from: { path: `${BACKEND}/modules/[^/]+/[^/]+\\.controller\\.ts$`, pathNot: TESTS },
      to: { path: `${BACKEND}/modules/[^/]+/[^/]+\\.repository\\.ts$` }
    },
    {
      name: 'backend-utils-and-schemas-are-leaves',
      severity: 'error',
      comment: 'utils/ and *.schemas.ts are pure helpers and must not import routes/controllers/services/repositories.',
      from: {
        path: [`${BACKEND}/modules/[^/]+/utils/`, `${BACKEND}/modules/[^/]+/[^/]+\\.schemas\\.ts$`],
        pathNot: TESTS
      },
      to: { path: BACKEND_UPPER_LAYERS }
    },

    // ── frontend layering: screens → infra ─────────────────────────────────
    {
      name: 'frontend-infra-not-to-screens',
      severity: 'error',
      comment: 'infra/ (query hooks) must not depend on screens/.',
      from: { path: `${FRONTEND}/modules/[^/]+/infra/`, pathNot: TESTS },
      to: { path: `${FRONTEND}/modules/[^/]+/screens/` }
    },

    // ── package boundaries ─────────────────────────────────────────────────
    {
      name: 'utilities-not-to-apps',
      severity: 'error',
      comment: 'echo_utilities is the shared base and must not import backend or frontend code.',
      from: { path: '^echo_utilities/src' },
      to: { path: '^echo_(backend|frontend)/' }
    },
    {
      name: 'backend-frontend-independent',
      severity: 'error',
      comment: 'Backend and frontend share code only through @echo/utilities.',
      from: { path: '^echo_backend/', pathNot: TESTS },
      to: { path: '^echo_frontend/' }
    },
    {
      name: 'frontend-not-to-backend',
      severity: 'error',
      comment: 'Backend and frontend share code only through @echo/utilities.',
      from: { path: '^echo_frontend/', pathNot: TESTS },
      to: { path: '^echo_backend/' }
    },
    {
      name: 'utilities-only-through-barrel',
      severity: 'error',
      comment:
        'Import from "@echo/utilities", never reach into echo_utilities by path (package-path deep imports are already blocked by its "exports" field).',
      from: { path: '^echo_(backend|frontend)/' },
      to: { path: '(^|/)echo_utilities/(?!dist/index\\.js$|package\\.json$)' }
    },
    {
      name: 'generated-only-inside-utilities',
      severity: 'error',
      comment: '__generated__ files are exposed through the @echo/utilities barrel only.',
      from: { pathNot: '^echo_utilities/' },
      to: { path: '__generated__' }
    },

    // ── production code vs tests ───────────────────────────────────────────
    {
      name: 'prod-not-to-tests',
      severity: 'error',
      comment: 'Production code must not import test files or test helpers.',
      from: { pathNot: [TESTS, `${FRONTEND}/test/`, `${FRONTEND}/setupTests\\.ts$`] },
      to: { path: [TESTS, `${FRONTEND}/test/`] }
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

module.exports = config

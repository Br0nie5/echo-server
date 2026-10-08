/**
 * Architecture rules of `echo_backend`, checked by `npm run arch:check`.
 * See docs/architecture.md for the conventions these rules enforce.
 */

import type { IConfiguration } from 'dependency-cruiser'

const MODULES = '^src/modules'
const SHARED = '^src/shared'
const TEST_HELPERS = '^src/test/'
const TESTS = '(^|/)(__tests__|__test__)/|\\.test\\.tsx?$'

/**
 * Folders of one layer of a module split into `domain/`, `application/`, `infra/` and
 * `presentation/`, and of its submodules (`modules/logs/modules/logsNotifier/`).
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

    // ── modules and submodules are isolated from each other ────────────────
    // Whatever the two sides are, the layer rules below already keep infra/ for infra/: what is
    // left to say here is that application/ and presentation/ stay private.
    {
      name: 'backend-modules-isolated',
      severity: 'error',
      comment:
        'A backend module may only import another module through its domain/ and infra/ (its models, its contracts and what implements them), or those of its submodules. Its application/ and presentation/ stay its own.',
      from: { path: `${MODULES}/([^/]+)/`, pathNot: TESTS },
      to: {
        path: `${MODULES}/`,
        pathNot: [`${MODULES}/$1/`, ...layer('domain|infra')]
      }
    },
    {
      name: 'backend-parent-not-to-submodule-internals',
      severity: 'error',
      comment:
        'A module may only import its submodules through their domain/ and infra/, as it would another module: a submodule builds on its parent, never the other way round.',
      from: { path: `${MODULES}/([^/]+)/(?!modules/)`, pathNot: TESTS },
      to: {
        path: `${MODULES}/$1/modules/`,
        pathNot: `${MODULES}/[^/]+/modules/[^/]+/(domain|infra)/`
      }
    },
    {
      name: 'backend-submodules-isolated',
      severity: 'error',
      comment:
        'A submodule may only import another submodule of its parent through its domain/ and infra/, as it would another module.',
      from: { path: `${MODULES}/([^/]+)/modules/([^/]+)/`, pathNot: TESTS },
      to: {
        path: `${MODULES}/$1/modules/`,
        pathNot: [
          `${MODULES}/$1/modules/$2/`,
          `${MODULES}/[^/]+/modules/[^/]+/(domain|infra)/`
        ]
      }
    },
    {
      name: 'backend-submodule-not-to-parent-internals',
      severity: 'error',
      comment:
        'A submodule may only import its parent through its domain/ and infra/, as it would another module, with one exception: its application/ may build on the use cases of the application/ of its parent (and on nothing more of it, see backend-application-not-to-outer-layers).',
      from: {
        path: `${MODULES}/([^/]+)/modules/[^/]+/`,
        pathNot: [TESTS, `${MODULES}/[^/]+/modules/[^/]+/application/`]
      },
      to: {
        path: `${MODULES}/$1/(?!modules/)`,
        pathNot: `${MODULES}/[^/]+/(domain|infra)/`
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

    // ── production code vs tests ───────────────────────────────────────────
    {
      name: 'prod-not-to-tests',
      severity: 'error',
      comment: 'Production code must not import test files or test helpers.',
      from: { pathNot: [TESTS, TEST_HELPERS] },
      to: { path: [TESTS, TEST_HELPERS] }
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

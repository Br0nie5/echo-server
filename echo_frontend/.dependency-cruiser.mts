/**
 * Architecture rules of `echo_frontend`, checked by `npm run arch:check`.
 * See docs/architecture.md for the conventions these rules enforce.
 */

import type { IConfiguration, IForbiddenRuleType } from 'dependency-cruiser'

const MODULES = '^src/modules'
const SHARED = '^src/shared/'
const INITIALIZERS = '^src/initializers/'
const APP = '^src/App\\.tsx$'
const ENTRY_POINT = '^src/main\\.tsx$'
const SETUP_TESTS = '^src/setupTests\\.ts$'
const LAYERS = 'domain|application|infra|presentation'
const TEST_HELPERS = '^src/test/'
const TESTS = '(^|/)__tests__/|\\.test\\.tsx?$'

/** Folders of one layer of a module split into `domain/`, `application/`, `infra/` and `presentation/`. */
const layer = (names: string): string => `${MODULES}/[^/]+/(${names})/`

/**
 * Files of `modules/` that are in no layer folder of their module: the layer rules know a file by
 * its layer folder, so they would not apply to these.
 */
const OUTSIDE_LAYERS = `${MODULES}/(?![^/]+/(${LAYERS})/)`

/**
 * Files of `src/` that are neither `main.tsx`, `App.tsx`, `setupTests.ts` nor `vite-env.d.ts`, nor
 * in one of the folders the rules know (`modules/`, `initializers/`, `shared/` and `test/`).
 */
const OUTSIDE_KNOWN_PLACES =
  '^src/(?!(main|App)\\.tsx$|setupTests\\.ts$|vite-env\\.d\\.ts$|(modules|initializers|shared|test)/)'

/** Packages the screens are drawn and navigated with, which only `presentation/` knows. */
const UI_PACKAGES = '(^|/)node_modules/(@mui|@emotion|react-router|react-router-dom)/'

/**
 * The three rules refusing every file of `path`, the tests apart.
 *
 * A rule is about a dependency, so one rule cannot catch every file: the first catches a file by
 * what it imports, `-when-imported` a file importing nothing, by what imports it, and
 * `-when-orphan` a file that neither imports anything nor is imported.
 */
const refuseFiles = (name: string, path: string, comment: string): IForbiddenRuleType[] => [
  {
    name,
    severity: 'error',
    comment: `${comment} Caught by what the file imports.`,
    from: { path, pathNot: TESTS },
    to: {}
  },
  {
    name: `${name}-when-imported`,
    severity: 'error',
    comment: `${comment} Caught by what imports the file, for one that imports nothing.`,
    from: {},
    to: { path, pathNot: TESTS }
  },
  {
    name: `${name}-when-orphan`,
    severity: 'error',
    comment: `${comment} Caught for a file that neither imports anything nor is imported.`,
    from: { orphan: true, path, pathNot: TESTS },
    to: {}
  }
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
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment:
        'An import that resolves to no file or package is a typo or a missing dependency, and no other rule can check where it goes.',
      from: {},
      to: { couldNotResolve: true }
    },

    // ── shared/ is a leaf, and the composition root is nobody's dependency ──
    {
      name: 'frontend-shared-is-self-contained',
      severity: 'error',
      comment:
        'src/shared is what the rest builds on: of the sources of the frontend, it only imports itself.',
      from: { path: SHARED, pathNot: TESTS },
      to: { path: '^src/', pathNot: SHARED }
    },
    {
      name: 'frontend-initializers-only-from-app',
      severity: 'error',
      comment:
        'src/initializers sets up the providers and the routes of the app: only App.tsx, the composition root, imports it, besides the test setup. Anything else importing it would reach every screen through it.',
      from: { pathNot: [INITIALIZERS, APP, TESTS, TEST_HELPERS, SETUP_TESTS] },
      to: { path: INITIALIZERS }
    },
    {
      name: 'frontend-app-only-from-entry-point',
      severity: 'error',
      comment: 'App.tsx is the composition root: only main.tsx, the entry point, imports it.',
      from: { pathNot: [ENTRY_POINT, TESTS, TEST_HELPERS] },
      to: { path: APP }
    },
    {
      name: 'frontend-entry-point-imported-by-nothing',
      severity: 'error',
      comment: 'main.tsx is the entry point, which the page loads: nothing imports it.',
      from: {},
      to: { path: ENTRY_POINT }
    },

    // ── every file is where the rules know it ──────────────────────────────
    ...refuseFiles(
      'frontend-src-files-in-known-places',
      OUTSIDE_KNOWN_PLACES,
      'Directly under src/, there is only main.tsx, the entry point, App.tsx, the composition root, setupTests.ts and vite-env.d.ts: anything else is in modules/, initializers/, shared/ or test/, which the other rules know.'
    ),
    ...refuseFiles(
      'frontend-module-files-in-a-layer',
      OUTSIDE_LAYERS,
      `A file of modules/ is in one of the layer folders (${LAYERS}) of its module: any other ` +
        'folder would escape the layer rules.'
    ),

    // ── modules are isolated from each other ───────────────────────────────
    {
      name: 'frontend-modules-isolated',
      severity: 'error',
      comment: 'A frontend module must not import from another module.',
      from: { path: `${MODULES}/([^/]+)/`, pathNot: TESTS },
      to: { path: `${MODULES}/`, pathNot: `${MODULES}/$1/` }
    },

    // ── layering: presentation → application → infra → domain ──────────────
    {
      name: 'frontend-domain-is-independent',
      severity: 'error',
      comment: 'domain/ holds the contracts the other layers build on, it depends on none of them.',
      from: { path: layer('domain'), pathNot: TESTS },
      to: { path: layer('application|infra|presentation') }
    },
    {
      name: 'frontend-domain-not-to-packages',
      severity: 'error',
      comment:
        'domain/ only states contracts, on the models of @echo/utilities: it imports no package, neither React, nor the API client, nor TanStack Query.',
      from: { path: layer('domain'), pathNot: TESTS },
      to: { path: '(^|/)node_modules/' }
    },
    {
      name: 'frontend-ui-packages-only-in-presentation',
      severity: 'error',
      comment:
        'Only presentation/ draws the screens and navigates between them: domain/, application/ and infra/ import neither MUI nor React Router.',
      from: { path: layer('domain|application|infra'), pathNot: TESTS },
      to: { path: UI_PACKAGES }
    },
    {
      name: 'frontend-infra-only-to-domain',
      severity: 'error',
      comment: 'infra/ implements the contracts of domain/ and knows nothing of the layers above.',
      from: { path: layer('infra'), pathNot: TESTS },
      to: { path: layer('application|presentation') }
    },
    {
      name: 'frontend-application-not-to-presentation',
      severity: 'error',
      comment: 'application/ (the query and mutation hooks) does not know the screens.',
      from: { path: layer('application'), pathNot: TESTS },
      to: { path: layer('presentation') }
    },
    {
      name: 'frontend-presentation-not-to-infra',
      severity: 'error',
      comment: 'presentation/ talks to application/, never directly to infra/.',
      from: { path: layer('presentation'), pathNot: TESTS },
      to: { path: layer('infra') }
    },

    // ── package boundaries ─────────────────────────────────────────────────
    // They hold for the tests too: a test is part of its package.
    {
      name: 'no-relative-import-outside-package',
      severity: 'error',
      comment:
        'A relative import stays inside echo_frontend. What is outside is either a package, imported by its name, or a file read when the app runs, whose path is in the config.',
      from: {},
      to: { path: '^\\.\\./', dependencyTypes: ['local'] }
    },
    {
      name: 'frontend-not-to-backend',
      severity: 'error',
      comment: 'Backend and frontend share code only through @echo/utilities.',
      from: {},
      to: { path: '(^|/)echo_backend/' }
    },
    {
      name: 'utilities-only-through-barrel',
      severity: 'error',
      comment:
        'Import from "@echo/utilities", which resolves to its barrel, and nothing else of echo_utilities (its "exports" field blocks the other paths of the package, and no-relative-import-outside-package the relative ones).',
      from: {},
      to: {
        path: '(^|/)echo_utilities/',
        pathNot: '(^|/)echo_utilities/dist/index\\.(js|d\\.ts)$'
      }
    },

    // ── production code vs tests ───────────────────────────────────────────
    {
      name: 'prod-not-to-tests',
      severity: 'error',
      comment: 'Production code must not import test files or test helpers.',
      from: { pathNot: [TESTS, TEST_HELPERS, '^src/setupTests\\.ts$'] },
      to: { path: [TESTS, TEST_HELPERS] }
    }
  ],

  options: {
    // What is outside the package is in the graph, so the package boundary rules see it, without
    // being cruised itself: its own package checks it.
    doNotFollow: { path: ['node_modules', '^\\.\\./'] },
    exclude: { path: ['^dist/', '/coverage/'] },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.app.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types']
    },
    reporterOptions: { text: { highlightFocused: true } }
  }
}

export default config

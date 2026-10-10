/**
 * Architecture rules of `echo_backend`, checked by `npm run arch:check`.
 * See docs/architecture.md for the conventions these rules enforce.
 */

import type { IConfiguration, IForbiddenRuleType } from 'dependency-cruiser'

const MODULES = '^src/modules'
const SHARED = '^src/shared/'
const FILES_SERVICE = '^src/shared/services/files\\.service\\.ts$'
const FILES_SERVICE_TEST = '^src/shared/services/__tests__/files\\.service\\.test\\.ts$'
const INITIALIZERS = '^src/initializers/'
const SERVER = '^src/server\\.ts$'
const ENTRY_POINT = '^src/main\\.ts$'
const LAYERS = 'domain|application|infra|presentation'
const TEST_HELPERS = '^src/test/'
const TESTS = '(^|/)__tests__/|\\.test\\.tsx?$'

/**
 * Folders of one layer of a module split into `domain/`, `application/`, `infra/` and
 * `presentation/`, and of its submodules (`modules/logs/modules/logsNotifier/`).
 */
const layer = (names: string): string[] => [
  `${MODULES}/[^/]+/(${names})/`,
  `${MODULES}/[^/]+/modules/[^/]+/(${names})/`
]

/**
 * Files of `modules/` that are in no layer folder, neither of a module nor of a submodule: the
 * layer rules know a file by its layer folder, so they would not apply to these.
 */
const OUTSIDE_LAYERS = `${MODULES}/(?![^/]+/(${LAYERS})/|[^/]+/modules/[^/]+/(${LAYERS})/)`

/**
 * Files of `src/` that are neither `main.ts` nor `server.ts`, nor in one of the folders the rules
 * know (`modules/`, `initializers/`, `shared/`, `test/` and the tests of `server.ts`).
 */
const OUTSIDE_KNOWN_PLACES =
  '^src/(?!(main|server)\\.ts$|(modules|initializers|shared|test|__tests__)/)'

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
      name: 'backend-shared-is-self-contained',
      severity: 'error',
      comment:
        'src/shared is what the rest builds on: of the sources of the backend, it only imports itself.',
      from: { path: SHARED, pathNot: TESTS },
      to: { path: '^src/', pathNot: SHARED }
    },
    {
      name: 'backend-fs-only-through-files-service',
      severity: 'error',
      comment:
        'The FilesService of src/shared/services/files.service.ts is the one access to the file system: anything else reads and writes files through it, never through fs.',
      from: { pathNot: [FILES_SERVICE, FILES_SERVICE_TEST] },
      to: { dependencyTypes: ['core'], path: '^(node:)?fs(/promises)?$' }
    },
    {
      name: 'backend-initializers-only-from-server',
      severity: 'error',
      comment:
        'src/initializers wires the infra/ and the presentation/ of the modules: only server.ts, the composition root, imports it. Anything else importing it would reach every layer through it.',
      from: { pathNot: [INITIALIZERS, SERVER, TESTS] },
      to: { path: INITIALIZERS }
    },
    {
      name: 'backend-initializers-not-to-application',
      severity: 'error',
      comment:
        'src/initializers wires the modules together: it builds their infra/ and hands it to their presentation/, which calls their application/ itself.',
      from: { path: INITIALIZERS, pathNot: TESTS },
      to: { path: layer('application') }
    },
    {
      name: 'backend-server-only-from-entry-point',
      severity: 'error',
      comment: 'server.ts is the composition root: only main.ts, the entry point, imports it.',
      from: { pathNot: [ENTRY_POINT, TESTS] },
      to: { path: SERVER }
    },

    // ── every file is where the rules know it ──────────────────────────────
    ...refuseFiles(
      'backend-src-files-in-known-places',
      OUTSIDE_KNOWN_PLACES,
      'Directly under src/, there is only main.ts, the entry point, and server.ts, the composition root: anything else is in modules/, initializers/, shared/ or test/, which the other rules know.'
    ),
    ...refuseFiles(
      'backend-module-files-in-a-layer',
      OUTSIDE_LAYERS,
      `A file of modules/ is in one of the layer folders (${LAYERS}) of its module or of its ` +
        'submodule: any other folder would escape the layer rules.'
    ),

    // ── modules and submodules are isolated from each other ────────────────
    // A module or a submodule may import the domain/ and the infra/ of any other one, whether it
    // is another module, its parent, one of its submodules or a submodule next to it. Whatever the
    // two sides are, the layer rules below already keep infra/ for infra/: what is left to say
    // here is that application/ and presentation/ stay private.
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
        'A module may only import its submodules through their domain/ and infra/, as it would another module: their application/ and presentation/ stay their own.',
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
        pathNot: [`${MODULES}/$1/modules/$2/`, `${MODULES}/[^/]+/modules/[^/]+/(domain|infra)/`]
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
      name: 'backend-domain-and-application-not-to-node',
      severity: 'error',
      comment:
        'domain/ states models and contracts, and application/ the business rules on top of them: neither reaches the machine, which infra/ does, so neither imports a built-in module of Node.js (fs, path, crypto, ...).',
      from: { path: layer('domain|application'), pathNot: TESTS },
      to: { dependencyTypes: ['core'] }
    },
    {
      name: 'backend-domain-and-application-not-to-fastify',
      severity: 'error',
      comment:
        'domain/ and application/ know nothing of the web framework, which presentation/ handles: neither fastify nor its plugins.',
      from: { path: layer('domain|application'), pathNot: TESTS },
      to: { path: '(^|/)node_modules/(fastify|fastify-[^/]+|@fastify)/' }
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
      name: 'backend-infra-not-to-upper-layers',
      severity: 'error',
      comment:
        'infra/ implements the contracts of domain/ and knows nothing of the layers above it, application/ and presentation/.',
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
    // They hold for the tests too: a test is part of its package.
    {
      name: 'no-relative-import-outside-package',
      severity: 'error',
      comment:
        'A relative import stays inside echo_backend. What is outside is either a package, imported by its name, or a file read when the server runs, whose path is in the config.',
      from: {},
      to: { path: '^\\.\\./', dependencyTypes: ['local'] }
    },
    {
      name: 'backend-frontend-independent',
      severity: 'error',
      comment: 'Backend and frontend share code only through @echo/utilities.',
      from: {},
      to: { path: '(^|/)echo_frontend/' }
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
      from: { pathNot: [TESTS, TEST_HELPERS] },
      to: { path: [TESTS, TEST_HELPERS] }
    }
  ],

  options: {
    // What is outside the package is in the graph, so the package boundary rules see it, without
    // being cruised itself: its own package checks it.
    doNotFollow: { path: ['node_modules', '^\\.\\./'] },
    exclude: { path: '^dist/' },
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

/**
 * Architecture rules of `echo_backend`, checked by `npm run arch:check`.
 * See docs/architecture.md for the conventions these rules enforce.
 */

import type { IConfiguration } from 'dependency-cruiser'

const MODULES = '^src/modules'
const SHARED = '^src/shared/'
const PLUGINS = '^src/plugins/'
const SERVER = '^src/server\\.ts$'
const ENTRY_POINT = '^src/main\\.ts$'
const LAYERS = 'domain|application|infra|presentation'
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

/**
 * Files of `modules/` that are in no layer folder, neither of a module nor of a submodule: the
 * layer rules know a file by its layer folder, so they would not apply to these.
 */
const OUTSIDE_LAYERS = `${MODULES}/(?![^/]+/(${LAYERS})/|[^/]+/modules/[^/]+/(${LAYERS})/)`

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
      name: 'backend-plugins-only-from-server',
      severity: 'error',
      comment:
        'src/plugins wires the infra/ and the presentation/ of the modules: only server.ts, the composition root, imports it. Anything else importing it would reach every layer through it.',
      from: { pathNot: [PLUGINS, SERVER, TESTS] },
      to: { path: PLUGINS }
    },
    {
      name: 'backend-server-only-from-entry-point',
      severity: 'error',
      comment: 'server.ts is the composition root: only main.ts, the entry point, imports it.',
      from: { pathNot: [ENTRY_POINT, TESTS] },
      to: { path: SERVER }
    },

    // ── every file of a module is in a layer ───────────────────────────────
    // A rule is about a dependency, so a file is caught by the ones it has, by the ones to it, or
    // by having none at all.
    {
      name: 'backend-module-files-in-a-layer',
      severity: 'error',
      comment: `A file of modules/ is in one of the layer folders (${LAYERS}) of its module or of its submodule: any other folder would escape the layer rules.`,
      from: { path: OUTSIDE_LAYERS, pathNot: TESTS },
      to: {}
    },
    {
      name: 'backend-module-files-in-a-layer-when-imported',
      severity: 'error',
      comment: `A file of modules/ is in one of the layer folders (${LAYERS}) of its module or of its submodule: any other folder would escape the layer rules.`,
      from: {},
      to: { path: OUTSIDE_LAYERS, pathNot: TESTS }
    },
    {
      name: 'backend-module-files-in-a-layer-when-orphan',
      severity: 'error',
      comment: `A file of modules/ is in one of the layer folders (${LAYERS}) of its module or of its submodule: any other folder would escape the layer rules.`,
      from: { orphan: true, path: OUTSIDE_LAYERS, pathNot: TESTS },
      to: {}
    },

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
      name: 'backend-domain-not-to-node',
      severity: 'error',
      comment:
        'domain/ states models and contracts, it does not reach the machine: no built-in module of Node.js (fs, path, crypto, ...).',
      from: { path: layer('domain'), pathNot: TESTS },
      to: { dependencyTypes: ['core'] }
    },
    {
      name: 'backend-domain-not-to-fastify',
      severity: 'error',
      comment: 'domain/ knows nothing of the web framework: neither fastify nor its plugins.',
      from: { path: layer('domain'), pathNot: TESTS },
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
    exclude: { path: ['^dist/', '/coverage/'] },
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

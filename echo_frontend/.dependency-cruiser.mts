/**
 * Architecture rules of `echo_frontend`, checked by `npm run arch:check`.
 * See docs/architecture.md for the conventions these rules enforce.
 */

import type { IConfiguration } from 'dependency-cruiser'

const MODULES = '^src/modules'
const SHARED = '^src/shared'
const TEST_HELPERS = '^src/test/'
const TESTS = '(^|/)(__tests__|__test__)/|\\.test\\.tsx?$'

/** Folders of one layer of a module split into `domain/`, `application/`, `infra/` and `presentation/`. */
const layer = (names: string): string => `${MODULES}/[^/]+/(${names})/`

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
      name: 'frontend-shared-not-to-modules',
      severity: 'error',
      comment: 'src/shared must not import from modules/.',
      from: { path: SHARED, pathNot: TESTS },
      to: { path: MODULES }
    },

    // ── modules are isolated from each other ───────────────────────────────
    {
      name: 'frontend-modules-isolated',
      severity: 'error',
      comment: 'A frontend module must not import from another module.',
      from: { path: `${MODULES}/([^/]+)/`, pathNot: TESTS },
      to: { path: `${MODULES}/`, pathNot: `${MODULES}/$1/` }
    },
    {
      name: 'modules-not-to-app-entry',
      severity: 'error',
      comment: 'Modules and shared code must not import the app entry points.',
      from: { path: [MODULES, SHARED], pathNot: TESTS },
      to: { path: '^src/(App|main)\\.tsx$' }
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
    {
      name: 'frontend-not-to-backend',
      severity: 'error',
      comment: 'Backend and frontend share code only through @echo/utilities.',
      from: { pathNot: TESTS },
      to: { path: '(^|/)echo_backend/' }
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
      from: { pathNot: [TESTS, TEST_HELPERS, '^src/setupTests\\.ts$'] },
      to: { path: [TESTS, TEST_HELPERS] }
    }
  ],

  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['/dist/', '/coverage/'] },
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

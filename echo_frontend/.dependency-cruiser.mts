/**
 * Architecture rules of `echo_frontend`, checked by `npm run arch:check`.
 * See docs/architecture.md for the conventions these rules enforce.
 */

import type { IConfiguration } from 'dependency-cruiser'

const MODULES = '^src/modules'
const SHARED = '^src/shared'
const TEST_HELPERS = '^src/test/'
const TESTS = '(^|/)(__tests__|__test__)/|\\.test\\.tsx?$'

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

    // ── layering: screens → infra ──────────────────────────────────────────
    {
      name: 'frontend-infra-not-to-screens',
      severity: 'error',
      comment: 'infra/ (query hooks) must not depend on screens/.',
      from: { path: `${MODULES}/[^/]+/infra/`, pathNot: TESTS },
      to: { path: `${MODULES}/[^/]+/screens/` }
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

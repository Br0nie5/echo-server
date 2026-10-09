/**
 * Architecture rules of `@echo/utilities`, checked by `npm run arch:check`.
 * See docs/architecture.md for the conventions these rules enforce.
 */

import type { IConfiguration } from 'dependency-cruiser'

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
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment:
        'An import that resolves to no file or package is a typo or a missing dependency, and no other rule can check where it goes.',
      from: {},
      to: { couldNotResolve: true }
    },

    // ── package boundaries ─────────────────────────────────────────────────
    {
      name: 'no-relative-import-outside-package',
      severity: 'error',
      comment:
        'A relative import stays inside echo_utilities. What is outside is either a package, imported by its name, or a file read when the app runs, whose path is in the config.',
      from: {},
      to: { path: '^\\.\\./', dependencyTypes: ['local'] }
    },
    {
      name: 'utilities-not-to-apps',
      severity: 'error',
      comment: '@echo/utilities is the shared base and must not import backend or frontend code.',
      from: {},
      to: { path: '(^|/)echo_(backend|frontend)/' }
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

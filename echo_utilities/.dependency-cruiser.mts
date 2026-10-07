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

    // ── package boundaries ─────────────────────────────────────────────────
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

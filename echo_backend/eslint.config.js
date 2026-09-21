import js from '@eslint/js'
import { globalIgnores } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import jsdoc from 'eslint-plugin-jsdoc'
import nodePlugin from 'eslint-plugin-n'
import prettierPlugin from 'eslint-plugin-prettier'
import tsdoc from 'eslint-plugin-tsdoc'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import prettierConfig from './prettier.config.js'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,ts}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    settings: {
      node: {
        version: '>=22.16.0'
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json'
        }
      }
    },
    ignores: ['coverage/*', '*.config.js', '*.config.ts', 'scripts/export_open_api.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: './tsconfig.json'
      }
    },
    plugins: {
      n: nodePlugin,
      import: importPlugin,
      prettier: prettierPlugin
    },
    rules: {
      // Node
      ...nodePlugin.configs['recommended'].rules,
      'n/no-process-exit': 'off',
      // Typescript
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      'max-len': [
        'warn',
        {
          code: 100,
          ignoreComments: true,
          ignoreUrls: true,
          ignoreStrings: true
        }
      ],
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/no-floating-promises': 'error',
      // Import
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ],
      'import/named': 'error', // ✅ Validates named imports actually exist
      'import/default': 'error', // ✅ Validates default import exists
      'import/no-named-as-default': 'error', // Optional: catches named as default
      // Prettier
      'prettier/prettier': ['error', prettierConfig]
    }
  },
  {
    files: ['eslint.config.js', 'vitest.config.ts', '**/__tests__/**/*'],
    rules: {
      'n/no-unpublished-import': 'off',
      'n/no-extraneous-import': 'off'
    }
  },
  {
    // Documentation (TSDoc): every exported function, interface and type has a comment. `@param` and
    // `@returns` are not required, since the types already say what goes in and out: add them when
    // a parameter or the result has a rule the types do not show. They are validated when present.
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      '**/__generated__/**',
      '**/__tests__/**',
      '**/__test__/**',
      '**/*.test.{ts,tsx}',
      'src/test/**',
      'src/setupTests.ts',
      'src/vite-env.d.ts'
    ],
    plugins: { jsdoc, tsdoc },
    rules: {
      'tsdoc/syntax': 'error',
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: { FunctionDeclaration: true, ArrowFunctionExpression: true },
          contexts: [
            'TSInterfaceDeclaration',
            'TSTypeAliasDeclaration',
            // Exported components wrapped in memo(...), which the function selectors do not see
            "ExportNamedDeclaration > VariableDeclaration[declarations.0.init.type='CallExpression']"
          ]
        }
      ],
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-hyphen-before-param-description': ['error', 'always'],
      'jsdoc/check-param-names': ['error', { checkDestructured: false }],
      'jsdoc/require-returns-description': 'error'
    }
  }
])

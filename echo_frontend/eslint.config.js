import js from '@eslint/js'
import { globalIgnores } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import jsdoc from 'eslint-plugin-jsdoc'
import prettierPlugin from 'eslint-plugin-prettier'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsdoc from 'eslint-plugin-tsdoc'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import prettierConfig from './prettier.config.js'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite
    ],
    ignores: ['coverage/*', '*.config.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: ['./tsconfig.json', './tsconfig.app.json', './tsconfig.node.json']
      }
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.cjs', '.jsx', '.ts', '.tsx', '.d.ts']
        },
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.app.json'
        }
      }
    },
    plugins: {
      react: reactPlugin,
      import: importPlugin,
      prettier: prettierPlugin
    },
    rules: {
      // React
      'react/jsx-uses-react': 'off', // Only needed in old React (<17)
      'react/react-in-jsx-scope': 'off', // Only needed in old React (<17)
      'react/prop-types': 'off', // Disable if using TypeScript
      'react/self-closing-comp': 'error', // Encourage self-closing tags
      'react/jsx-key': 'error', // Warn if missing "key" in lists
      'react/jsx-no-undef': 'error', // Disallow undefined JSX components
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-comment-textnodes': 'error',
      'react/no-children-prop': 'error',
      'react/jsx-filename-extension': [
        'warn',
        {
          extensions: ['.tsx']
        }
      ],
      // React Hooks
      'react-hooks/rules-of-hooks': 'error', // ✅ Enforce hooks rules
      'react-hooks/exhaustive-deps': 'error', // ✅ Warn for missing deps in useEffect
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
      'import/no-unresolved': 'error', // ✅ Highlights imports that don't resolve
      'import/named': 'error', // ✅ Validates named imports actually exist
      'import/default': 'error', // ✅ Validates default import exists
      'import/no-named-as-default': 'error', // Optional: catches named as default
      // Prettier
      'prettier/prettier': ['error', prettierConfig]
    }
  },
  {
    files: ['eslint.config.js'],
    rules: {
      'import/no-unresolved': 'off'
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

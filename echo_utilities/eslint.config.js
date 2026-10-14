import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import jsdoc from 'eslint-plugin-jsdoc'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import tsdoc from 'eslint-plugin-tsdoc'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,ts,mts}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals['shared-node-browser'],
      parserOptions: {
        // Without it, typescript-eslint cannot tell which tsconfig.json of the repository is this
        // package's when ESLint runs from the root, as the editor does, and fails on every file.
        tsconfigRootDir: import.meta.dirname
      }
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.ts', '.mts', '.d.ts']
        },
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json'
        }
      }
    },
    plugins: {
      import: importPlugin
    },
    rules: {
      // TypeScript
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      // JavaScript
      eqeqeq: 'error',
      // Imports
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ],
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/no-named-as-default': 'error'
    }
  },
  // Runs Prettier as a rule, and turns off the rules of ESLint that would fight it
  // (eslint-config-prettier). It comes after the rules above, so that it wins over them.
  prettierRecommended,
  {
    // Documentation (TSDoc): every exported function, interface and type has a comment. `@param` and
    // `@returns` are not required, since the types already say what goes in and out: add them when
    // a parameter or the result has a rule the types do not show. They are validated when present.
    files: ['src/**/*.ts'],
    ignores: ['**/__tests__/**'],
    plugins: { jsdoc, tsdoc },
    rules: {
      'tsdoc/syntax': 'error',
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: { FunctionDeclaration: true, ArrowFunctionExpression: true },
          contexts: ['TSInterfaceDeclaration', 'TSTypeAliasDeclaration']
        }
      ],
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-hyphen-before-param-description': ['error', 'always'],
      'jsdoc/check-param-names': ['error', { checkDestructured: false }],
      'jsdoc/require-returns-description': 'error'
    }
  }
])

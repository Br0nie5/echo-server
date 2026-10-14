import { defineConfig } from 'eslint/config'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import { reactRefresh } from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import { createEslintConfig } from '../eslint.shared.js'

export default defineConfig([
  ...createEslintConfig({
    packageDirPath: import.meta.dirname,
    fileExtensions: ['js', 'ts', 'mts', 'tsx'],
    globals: globals.browser,
    parserOptions: {
      project: ['./tsconfig.app.json', './tsconfig.test.json', './tsconfig.node.json']
    },
    tsconfigFileName: 'tsconfig.app.json',
    undocumentedFiles: ['**/*.test.{ts,tsx}', 'src/setupTests.ts', 'src/vite-env.d.ts']
  }),
  {
    files: ['**/*.{js,ts,mts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.cjs', '.jsx', '.ts', '.tsx', '.d.ts']
        }
      }
    },
    plugins: {
      react: reactPlugin
    },
    rules: {
      // React
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/self-closing-comp': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-comment-textnodes': 'error',
      'react/no-children-prop': 'error',
      'react/jsx-filename-extension': [
        'error',
        {
          extensions: ['.tsx']
        }
      ],
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error'
    }
  },
  {
    // No tsconfig covers this file, which Node.js runs as it is: it is linted without types.
    files: ['eslint.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
    rules: {
      'import/no-unresolved': 'off'
    }
  }
])

import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettierPlugin from 'eslint-plugin-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// The files at the root of the repository only: each workspace lints its own with its own config.
export default defineConfig([
  globalIgnores(['echo_*/', 'coverage']),
  {
    files: ['*.{js,ts}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        // The config files are out of the tsconfig.json, as in the workspaces, so they are typed on
        // their own: the editor lints every workspace in one process, which shares these settings.
        projectService: {
          allowDefaultProject: ['*.config.js']
        }
      }
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      eqeqeq: 'error',
      'prettier/prettier': 'error'
    }
  }
])

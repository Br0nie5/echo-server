import { defineConfig } from 'eslint/config'
import nodePlugin from 'eslint-plugin-n'
import globals from 'globals'

import { createEslintConfig } from '../eslint.shared.js'

export default defineConfig([
  ...createEslintConfig({
    packageDirPath: import.meta.dirname,
    fileExtensions: ['js', 'ts', 'mts'],
    globals: globals.node,
    // The config files are out of the sources tsconfig.json compiles, so they are typed on their
    // own.
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.config.js', '*.config.ts', '.dependency-cruiser.mts']
      }
    },
    tsconfigFileName: 'tsconfig.json'
  }),
  {
    files: ['**/*.{js,ts,mts}'],
    settings: {
      node: {
        version: '>=24.0.0'
      }
    },
    plugins: {
      n: nodePlugin
    },
    rules: {
      ...nodePlugin.configs['recommended'].rules,
      'n/no-process-exit': 'off'
    }
  },
  {
    files: ['*.config.js', '*.config.ts', '.dependency-cruiser.mts', '**/__tests__/**/*'],
    rules: {
      'n/no-unpublished-import': 'off',
      'n/no-extraneous-import': 'off'
    }
  }
])

import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'

import { createEslintConfig } from './eslint.shared.js'

// The files at the root of the repository only: each workspace lints its own with its own config.
export default defineConfig([
  globalIgnores(['echo_*/']),
  ...createEslintConfig({
    packageDirPath: import.meta.dirname,
    fileExtensions: ['js', 'ts'],
    globals: globals.node,
    // The config files are out of the tsconfig.json, as in the workspaces, so they are typed on
    // their own: the editor lints every workspace in one process, which shares these settings.
    parserOptions: { projectService: { allowDefaultProject: ['*.config.js', 'eslint.shared.js'] } },
    tsconfigFileName: 'tsconfig.json'
  })
])

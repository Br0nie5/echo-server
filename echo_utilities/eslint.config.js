import globals from 'globals'

import { createEslintConfig } from '../eslint.shared.js'

export default createEslintConfig({
  packageDirPath: import.meta.dirname,
  fileExtensions: ['js', 'ts', 'mts'],
  globals: globals['shared-node-browser'],
  // This file is out of the tsconfig.json, so it is typed on its own.
  parserOptions: { projectService: { allowDefaultProject: ['eslint.config.js'] } },
  tsconfigFileName: 'tsconfig.json'
})

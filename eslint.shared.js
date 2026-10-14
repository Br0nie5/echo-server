import path from 'path'

import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import jsdoc from 'eslint-plugin-jsdoc'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import tsdoc from 'eslint-plugin-tsdoc'
import tseslint from 'typescript-eslint'

/**
 * Builds the ESLint config the root of the repository and each of its packages start from, so the
 * rules they have in common behave the same everywhere.
 *
 * It lints the files of `fileExtensions` with the recommended rules of ESLint and of
 * typescript-eslint, the TypeScript, import and documentation rules of the repository, and
 * Prettier, whose config is the one of the root, `prettier.config.js`. The rules that need the
 * types (such as `@typescript-eslint/no-floating-promises`) read them through `parserOptions`,
 * which say where the tsconfig files are: `{ projectService: … }` or `{ project: [...] }`.
 * `tsconfigFileName`, relative to `packageDirPath`, is the tsconfig the imports are resolved with.
 *
 * Every exported function, interface and type of `src/` must have a TSDoc comment, but those of
 * the tests (`__tests__/`, `src/test/`) and of `undocumentedFiles`. `dist/` and `coverage/` are
 * ignored.
 *
 * A package adds what is its own after it:
 *
 * ```js
 * export default defineConfig([
 *   ...createEslintConfig({
 *     packageDirPath: import.meta.dirname,
 *     fileExtensions: ['js', 'ts'],
 *     globals: globals.node,
 *     parserOptions: { projectService: { allowDefaultProject: ['*.config.js'] } },
 *     tsconfigFileName: 'tsconfig.json'
 *   }),
 *   { files: ['**\/*.ts'], rules: { 'no-console': 'error' } }
 * ])
 * ```
 *
 * @param {object} options - What differs from one package to another.
 * @param {string} options.packageDirPath - The directory of the package, its `import.meta.dirname`.
 * @param {string[]} options.fileExtensions - The extensions of the files to lint, without their
 *   dot.
 * @param {Record<string, boolean | 'readonly' | 'writable' | 'off'>} options.globals - The global
 *   variables of the platform the package runs on, from the `globals` package.
 * @param {Record<string, unknown>} options.parserOptions - Where typescript-eslint reads the types.
 * @param {string} options.tsconfigFileName - The tsconfig the imports are resolved with.
 * @param {string[]} [options.undocumentedFiles] - The files of `src/` that need no TSDoc comment,
 *   besides the tests.
 * @returns {import('eslint').Linter.Config[]} The config, to spread into the one of the package.
 */
export const createEslintConfig = ({
  packageDirPath,
  fileExtensions,
  globals,
  parserOptions,
  tsconfigFileName,
  undocumentedFiles = []
}) => {
  const files = [`**/*.{${fileExtensions.join(',')}}`]

  return defineConfig([
    globalIgnores(['dist', 'coverage']),
    {
      files,
      extends: [js.configs.recommended, tseslint.configs.recommended],
      languageOptions: {
        ecmaVersion: 2022,
        globals,
        parserOptions: {
          // Without it, typescript-eslint cannot tell which tsconfig.json of the repository is the
          // one of the package when ESLint runs from the root, as the editor does.
          tsconfigRootDir: packageDirPath,
          ...parserOptions
        }
      },
      settings: {
        'import/resolver': {
          typescript: {
            alwaysTryTypes: true,
            project: path.join(packageDirPath, tsconfigFileName)
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
        '@typescript-eslint/no-unused-vars': ['error'],
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/ban-ts-comment': 'error',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
        '@typescript-eslint/no-floating-promises': 'error',
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
    {
      // A JavaScript file cannot declare the type a function returns.
      files: ['**/*.{ts,mts,tsx}'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'error'
      }
    },
    // Runs Prettier as a rule, and turns off the rules of ESLint that would fight it
    // (eslint-config-prettier). It comes after the rules above, so that it wins over them.
    prettierRecommended,
    {
      // eslint-config-prettier turns it off, while Prettier does not wrap a comment.
      files,
      rules: {
        'max-len': [
          'error',
          { code: 100, ignoreComments: false, ignoreUrls: true, ignoreStrings: true }
        ]
      }
    },
    {
      // Documentation (TSDoc): every exported function, interface and type has a comment.
      // `@param` and `@returns` are not required, since the types already say what goes in and
      // out: add them when a parameter or the result has a rule the types do not show. They are
      // validated when present.
      files: ['src/**/*.{ts,mts,tsx}'],
      ignores: ['**/__tests__/**', 'src/test/**', ...undocumentedFiles],
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
              // Exported values made by a call, such as a component wrapped in memo(...) or a
              // plugin in fastifyPlugin(...), which the function selectors do not see
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
}

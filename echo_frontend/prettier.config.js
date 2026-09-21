// prettier.config.js
export default {
  semi: false, // ❌ No semicolons at the end of statements
  singleQuote: true, // ✅ Use single quotes instead of double
  trailingComma: 'none', // ✅ Adds trailing commas wherever possible (ES5 compatible)
  printWidth: 100, // ✅ Line length limit before wrapping
  tabWidth: 2, // ✅ Use 2 spaces per indentation level
  useTabs: false, // ✅ Use spaces, not tabs
  bracketSpacing: true, // ✅ Adds spaces between object braces: { foo: bar }
  arrowParens: 'always', // ✅ Always include parens in arrow functions: (x) => x
  endOfLine: 'lf', // ✅ Use LF for line endings (prevents Windows/mac conflicts)
  embeddedLanguageFormatting: 'auto', // ✅ Format code blocks inside markdown or HTML
  jsxSingleQuote: false, // ❌ Use double quotes in JSX attributes: <Component prop="value" />
  htmlWhitespaceSensitivity: 'css', // ✅ Respect CSS display rules for HTML formatting
  proseWrap: 'preserve', // ✅ Preserve Markdown line breaks
  quoteProps: 'as-needed' // ✅ Only quote object keys when required
}

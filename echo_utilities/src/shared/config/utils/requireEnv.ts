/**
 * Reads the required variable named `key` in `env`, as text, without the spaces around it.
 *
 * `env` is whatever holds the variables as they were written: `process.env` in the backend, the
 * content of `env.<mode>.json` in the frontend, where a value may be written as a number or a
 * boolean, given here as its text. Throws when the variable is missing or blank.
 *
 * ```ts
 * requireEnv({ SERVER_NAME: ' Echo ' }, 'SERVER_NAME') // 'Echo'
 * requireEnv({ HAS_AUTHENTICATION: true }, 'HAS_AUTHENTICATION') // 'true'
 * ```
 */
export const requireEnv = (env: Record<string, unknown>, key: string): string => {
  const value = env[key]
  const text = typeof value === 'number' || typeof value === 'boolean' ? String(value) : value

  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return text.trim()
}

/**
 * Reads the required variable named `key` in `env`, as text, without the spaces around it.
 *
 * `env` holds the variables as they were written. A value written as a number or a boolean, as a
 * JSON file allows, is given as its text. Throws when the variable is missing or blank.
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

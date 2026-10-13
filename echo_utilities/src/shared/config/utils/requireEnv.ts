/**
 * Reads the required variable named `key` in `env`, as text, without the spaces around it.
 *
 * `env` holds the variables as they were written. A value written as a number or a boolean, as a
 * JSON file allows, is given as its text. Throws when the variable is missing, `null` or blank, and
 * when it is anything else that is no text, such as a list or an object.
 *
 * ```ts
 * requireEnv({ SERVER_NAME: ' Echo ' }, 'SERVER_NAME') // 'Echo'
 * requireEnv({ HAS_AUTHENTICATION: true }, 'HAS_AUTHENTICATION') // 'true'
 * ```
 */
export const requireEnv = (env: Record<string, unknown>, key: string): string => {
  const value = env[key] ?? ''

  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    throw new Error(
      `Invalid environment variable: ${key} is neither a text, a number nor a boolean`
    )
  }

  const text = String(value).trim()

  if (text === '') {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return text
}

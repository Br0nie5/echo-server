/**
 * Reads the variable named `key` in `processEnv`.
 *
 * Throws when the variable is missing or empty.
 */
export const requireEnv = (processEnv: NodeJS.ProcessEnv, key: string): string => {
  const value = processEnv[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

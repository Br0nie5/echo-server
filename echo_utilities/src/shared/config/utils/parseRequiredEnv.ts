import { addEnvNameToError } from './addEnvNameToError.js'
import { requireEnv } from './requireEnv.js'

/**
 * Reads the required variable `envName` of `env` and gives what `parse` makes of its text.
 *
 * Throws when the variable is missing or blank (see `requireEnv`), and when `parse` throws, the
 * error then naming the variable (see `addEnvNameToError`).
 *
 * ```ts
 * const hasAuthentication = parseRequiredEnv(env, 'HAS_AUTHENTICATION', parseBoolean)
 * ```
 */
export const parseRequiredEnv = <T>(
  env: Record<string, unknown>,
  envName: string,
  parse: (raw: string) => T
): T => {
  const raw = requireEnv(env, envName)

  return addEnvNameToError(envName, () => parse(raw))
}

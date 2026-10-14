import type { Config } from './config.js'
import { parseBoolean } from './utils/parseBoolean.js'
import { parseRequiredEnv } from './utils/parseRequiredEnv.js'
import { requireEnv } from './utils/requireEnv.js'

/**
 * Builds the `Config` from `env`, the variables as they were written.
 *
 * `env` may hold other variables, which are not read. Throws when `SERVER_NAME` is missing, blank
 * or no text, and when `HAS_AUTHENTICATION` is missing or neither `true` nor `false`.
 *
 * ```ts
 * const config = parseConfig({ SERVER_NAME: 'my-server', HAS_AUTHENTICATION: 'true' })
 * config.hasAuthentication // true
 * ```
 */
export const parseConfig = (env: Record<string, unknown>): Config => ({
  serverName: requireEnv(env, 'SERVER_NAME'),
  hasAuthentication: parseRequiredEnv(env, 'HAS_AUTHENTICATION', parseBoolean)
})

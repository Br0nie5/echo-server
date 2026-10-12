import type { Config } from './config.js'
import { parseBoolean } from './utils/parseBoolean.js'
import { parseRequiredEnv } from './utils/parseRequiredEnv.js'
import { requireEnv } from './utils/requireEnv.js'

/**
 * Builds the `Config` from `rawConfig`, the variables as they were written.
 *
 * `rawConfig` may hold other variables, which are not read. Throws when `SERVER_NAME` is missing or
 * blank, and when `HAS_AUTHENTICATION` is missing or neither `true` nor `false`.
 *
 * ```ts
 * const config = parseConfig({ SERVER_NAME: 'my-server', HAS_AUTHENTICATION: 'true' })
 * config.HAS_AUTHENTICATION // true
 * ```
 */
export const parseConfig = (rawConfig: Record<string, unknown>): Config => ({
  SERVER_NAME: requireEnv(rawConfig, 'SERVER_NAME'),
  HAS_AUTHENTICATION: parseRequiredEnv(rawConfig, 'HAS_AUTHENTICATION', parseBoolean)
})

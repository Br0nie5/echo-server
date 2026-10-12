import type { Config } from './config.js'
import { parseBoolean } from './utils/parseBoolean.js'
import { parseRequiredEnv } from './utils/parseRequiredEnv.js'
import { requireEnv } from './utils/requireEnv.js'

/**
 * Builds the `Config` common to the backend and the frontend from `rawConfig`.
 *
 * `rawConfig` is whatever holds the variables as they were written: `process.env` in the backend,
 * the content of `env.<mode>.json` in the frontend. It throws when `SERVER_NAME` is missing or
 * blank, and when `HAS_AUTHENTICATION` is missing or neither `true` nor `false`.
 *
 * ```ts
 * const config = parseConfig({ ...process.env })
 * config.HAS_AUTHENTICATION // true
 * ```
 */
export const parseConfig = (rawConfig: Record<string, unknown>): Config => ({
  SERVER_NAME: requireEnv(rawConfig, 'SERVER_NAME'),
  HAS_AUTHENTICATION: parseRequiredEnv(rawConfig, 'HAS_AUTHENTICATION', parseBoolean)
})

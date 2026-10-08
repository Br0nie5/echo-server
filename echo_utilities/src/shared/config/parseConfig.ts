import type { Config } from './config.js'

/** The value if it is a non-blank string, throwing otherwise. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requireString = (value: any, key: string): string => {
  if (typeof value === 'string' && value.trim() !== '') return value
  throw new Error(`Missing required environment variable: ${key}`)
}

/** Reads a boolean given as a boolean or as the string `true`/`false`, throwing otherwise. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requireBooleanOrString = (value: any, key: string): boolean => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === 'true') return true
    if (trimmed === 'false') return false
  }
  throw new Error(`Missing required environment variable: ${key}`)
}

/** Resolves `path` against `serverUrl`, throwing if `serverUrl` is not a valid URL. */
const buildUrl = (serverUrl: string, path: string): string => {
  try {
    return new URL(path, serverUrl).toString()
  } catch {
    throw new Error(`Invalid SERVER_URL: ${serverUrl}`)
  }
}

/**
 * Builds the `Config` common to the backend and the frontend from `rawConfig`.
 *
 * `rawConfig` is whatever holds the variables as they were written: `process.env` in the backend,
 * the content of `env.<mode>.json` in the frontend. `HAS_AUTHENTICATION` may be a boolean or the
 * string `true` or `false`. It throws when `SERVER_NAME`, `SERVER_URL` or `HAS_AUTHENTICATION` is
 * missing or invalid.
 *
 * ```ts
 * const config = parseConfig({ ...process.env })
 * config.API_URL // `${SERVER_URL}/api`
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseConfig = (rawConfig: any): Config => {
  const SERVER_URL = requireString(rawConfig.SERVER_URL, 'SERVER_URL')

  return {
    SERVER_NAME: requireString(rawConfig.SERVER_NAME, 'SERVER_NAME'),
    SERVER_URL,
    API_URL: buildUrl(SERVER_URL, '/api'),
    APP_URL: buildUrl(SERVER_URL, '/app'),
    HAS_AUTHENTICATION: requireBooleanOrString(rawConfig.HAS_AUTHENTICATION, 'HAS_AUTHENTICATION')
  }
}

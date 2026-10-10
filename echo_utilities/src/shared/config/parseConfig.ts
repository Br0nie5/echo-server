import type { Config } from './config.js'
import { apiRoutePrefix, appRoutePrefix } from './routePrefixes.js'

/** Gives `value` if it is a non-blank string, throwing an error naming the variable `key` otherwise. */
const requireString = (value: unknown, key: string): string => {
  if (typeof value === 'string' && value.trim() !== '') {
    return value
  }

  throw new Error(`Missing required environment variable: ${key}`)
}

/**
 * Reads the boolean variable `key` from `value`, given as a boolean or as the string `true` or
 * `false`.
 *
 * It throws an error naming the variable when `value` is missing or is anything else.
 */
const requireBoolean = (value: unknown, key: string): boolean => {
  if (typeof value === 'boolean') {
    return value
  }

  const trimmedValue = typeof value === 'string' ? value.trim() : value

  if (trimmedValue === 'true') {
    return true
  }

  if (trimmedValue === 'false') {
    return false
  }

  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  throw new Error(`Invalid environment variable ${key}: ${value}, it should be true or false`)
}

/**
 * Gives the URL of `routePrefix` below `serverUrl`, keeping the path of `serverUrl`: `/api` below
 * `https://domain.com/echo/` is `https://domain.com/echo/api`.
 *
 * It throws if `serverUrl` is not a valid URL.
 */
const buildUrl = (serverUrl: string, routePrefix: string): string => {
  let url: URL
  try {
    url = new URL(serverUrl)
  } catch {
    throw new Error(`Invalid SERVER_URL: ${serverUrl}`)
  }

  url.pathname = `${url.pathname.replace(/\/+$/, '')}${routePrefix}`

  return url.toString()
}

/**
 * Builds the `Config` common to the backend and the frontend from `rawConfig`.
 *
 * `rawConfig` is whatever holds the variables as they were written: `process.env` in the backend,
 * the content of `env.<mode>.json` in the frontend. `HAS_AUTHENTICATION` may be a boolean or the
 * string `true` or `false`. `API_URL` and `APP_URL` are `SERVER_URL` followed by `apiRoutePrefix`
 * and `appRoutePrefix`, so they keep its path: Echo can be reached at any path behind a reverse
 * proxy. It throws when `SERVER_NAME`, `SERVER_URL` or `HAS_AUTHENTICATION` is missing or
 * invalid.
 *
 * ```ts
 * const config = parseConfig({ ...process.env, SERVER_URL: 'https://domain.com/echo' })
 * config.API_URL // 'https://domain.com/echo/api'
 * ```
 */
export const parseConfig = (rawConfig: Record<string, unknown>): Config => {
  const SERVER_URL = requireString(rawConfig.SERVER_URL, 'SERVER_URL')

  return {
    SERVER_NAME: requireString(rawConfig.SERVER_NAME, 'SERVER_NAME'),
    SERVER_URL,
    API_URL: buildUrl(SERVER_URL, apiRoutePrefix),
    APP_URL: buildUrl(SERVER_URL, appRoutePrefix),
    HAS_AUTHENTICATION: requireBoolean(rawConfig.HAS_AUTHENTICATION, 'HAS_AUTHENTICATION')
  }
}

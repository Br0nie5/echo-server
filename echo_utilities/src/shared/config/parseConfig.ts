import type { Config } from './config.js'

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
 * Builds the `Config` common to the backend and the frontend from `rawConfig`.
 *
 * `rawConfig` is whatever holds the variables as they were written: `process.env` in the backend,
 * the content of `env.<mode>.json` in the frontend. `HAS_AUTHENTICATION` may be a boolean or the
 * string `true` or `false`. It throws when `SERVER_NAME` or `HAS_AUTHENTICATION` is missing or
 * invalid.
 *
 * ```ts
 * const config = parseConfig({ ...process.env })
 * config.HAS_AUTHENTICATION // true
 * ```
 */
export const parseConfig = (rawConfig: Record<string, unknown>): Config => ({
  SERVER_NAME: requireString(rawConfig.SERVER_NAME, 'SERVER_NAME'),
  HAS_AUTHENTICATION: requireBoolean(rawConfig.HAS_AUTHENTICATION, 'HAS_AUTHENTICATION')
})

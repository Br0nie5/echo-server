import type { EchoEnv } from '../types/env.js'

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

/** Validates the variables shared by the backend (`process.env`) and the frontend (`env.<mode>.json`). Throws on a missing or invalid one. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseEchoEnv = (envHolder: any): EchoEnv => {
  const SERVER_URL = requireString(envHolder.SERVER_URL, 'SERVER_URL')

  return {
    SERVER_NAME: requireString(envHolder.SERVER_NAME, 'SERVER_NAME'),
    SERVER_URL,
    API_URL: buildUrl(SERVER_URL, '/api'),
    APP_URL: buildUrl(SERVER_URL, '/app'),
    HAS_AUTHENTICATION: requireBooleanOrString(envHolder.HAS_AUTHENTICATION, 'HAS_AUTHENTICATION')
  }
}

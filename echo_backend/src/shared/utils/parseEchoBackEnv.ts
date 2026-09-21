import { readFileSync } from 'fs'
import { isIP } from 'net'

import { getDomain, isLogCategory, parseEchoEnv } from '@echo/utilities'
import dotenv from 'dotenv'
import cron from 'node-cron'

import type { EchoBackEnv, LogsCronOptions, TlsOptions } from '../types/echoBackEnv.js'

/** The value of the variable, throwing if it is missing or empty. */
const requireEnv = (processEnv: NodeJS.ProcessEnv, key: string): string => {
  const value = processEnv[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

/** Parses `HTTP_PORT`, throwing unless it is an integer between 1 and 65535. */
const parseHttpPort = (raw: string): number => {
  const port = Number(raw)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid HTTP_PORT: ${raw}`)
  }
  return port
}

/** Domain allowed by CORS and used for the cookie. IP addresses map to `localhost`, since a cookie cannot be set on an IP domain. */
const parseAllowedDomain = ({ serverUrl }: { serverUrl: string }): string => {
  // serverUrl is already a validated URL by this point,
  // so getDomain can only return its hostname fallback here, never undefined.
  const appUrlDomain = getDomain(serverUrl) as string

  return isIP(appUrlDomain) !== 0 ? 'localhost' : appUrlDomain
}

/** Reads the TLS certificate and key when both paths are set. Throws on a partial or inconsistent setup (not production, `SERVER_URL` not https). */
const parseTlsOptions = (
  processEnv: NodeJS.ProcessEnv,
  { mode, serverUrl }: { mode: 'production' | 'development'; serverUrl: string }
): TlsOptions | undefined => {
  const TLS_CERT_PATH = processEnv.TLS_CERT_PATH
  const TLS_KEY_PATH = processEnv.TLS_KEY_PATH

  if (!TLS_CERT_PATH && !TLS_KEY_PATH) {
    return undefined
  }

  if (mode !== 'production') {
    throw new Error('TLS_CERT_PATH and TLS_KEY_PATH are only supported when NODE_ENV=production')
  }

  if (!TLS_CERT_PATH || !TLS_KEY_PATH) {
    throw new Error('TLS_CERT_PATH and TLS_KEY_PATH must both be set to enable HTTPS')
  }

  if (new URL(serverUrl).protocol !== 'https:') {
    throw new Error('SERVER_URL must use https:// when TLS_CERT_PATH and TLS_KEY_PATH are set')
  }

  return {
    cert: readFileSync(TLS_CERT_PATH),
    key: readFileSync(TLS_KEY_PATH)
  }
}

/** Cron settings, or `undefined` (cron disabled) unless all of them are present and valid. Unknown watched categories are ignored. */
const parseLogsCronOptions = (processEnv: NodeJS.ProcessEnv): LogsCronOptions | undefined => {
  const LOGS_CRON_SCHEDULE_REGEX = processEnv.LOGS_CRON_SCHEDULE_REGEX
  const WATCHED_LOGS_CATEGORIES_RAW = processEnv.LOGS_CRON_WATCHED_LOGS_CATEGORIES
  const TELEGRAM_CHAT_ID = processEnv.LOGS_CRON_TELEGRAM_CHAT_ID
  const TELEGRAM_BASE_URL = processEnv.LOGS_CRON_TELEGRAM_BASE_URL

  const WATCHED_LOGS_CATEGORIES = WATCHED_LOGS_CATEGORIES_RAW?.split(',')
    .map((category) => category.trim())
    .filter((category) => isLogCategory(category))

  if (
    !LOGS_CRON_SCHEDULE_REGEX ||
    !cron.validate(LOGS_CRON_SCHEDULE_REGEX) ||
    !WATCHED_LOGS_CATEGORIES ||
    WATCHED_LOGS_CATEGORIES.length === 0 ||
    !TELEGRAM_CHAT_ID ||
    !TELEGRAM_BASE_URL
  ) {
    return undefined
  }

  return {
    LOGS_CRON_SCHEDULE_REGEX,
    WATCHED_LOGS_CATEGORIES,
    TELEGRAM_CHAT_ID,
    TELEGRAM_BASE_URL
  }
}

/** Loads `.env.<mode>` (without overriding real env vars) then validates and builds the backend env. Throws on the first invalid required value. */
const parseEchoBackEnv = (processEnv: NodeJS.ProcessEnv): EchoBackEnv => {
  const mode = processEnv.NODE_ENV === 'production' ? processEnv.NODE_ENV : 'development'
  dotenv.config({ path: `.env.${mode}`, override: false, quiet: true })

  const echoEnv = parseEchoEnv({ ...processEnv })

  const allowed_domain = parseAllowedDomain({
    serverUrl: echoEnv.SERVER_URL
  })

  const logsCronOptions = parseLogsCronOptions(processEnv)
  const tlsOptions = parseTlsOptions(processEnv, { mode, serverUrl: echoEnv.SERVER_URL })

  return {
    ...echoEnv,
    HOST: '0.0.0.0',
    PORT: parseHttpPort(requireEnv(processEnv, 'HTTP_PORT')),
    LOGS_DIR_PATH: requireEnv(processEnv, 'LOGS_DIR_PATH'),
    ALLOWED_DOMAIN: allowed_domain,
    COOKIE_NAME: `${allowed_domain}_access_token`,
    COOKIE_SERIALIZE_OPTIONS: {
      domain: allowed_domain !== 'localhost' ? allowed_domain : undefined,
      path: '/',
      secure: !allowed_domain.includes('localhost'),
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60
    },
    LOGS_CRON_OPTIONS: logsCronOptions,
    TLS_OPTIONS: tlsOptions
  }
}

/** The backend env, parsed once when the module is first imported. */
export const env = parseEchoBackEnv(process.env)

import type { EchoEnv, LogCategory } from '@echo/utilities'
import type { CookieSerializeOptions } from '@fastify/cookie'

/** Settings of the optional cron notifying the problem logs on Telegram. */
export type LogsCronOptions = {
  LOGS_CRON_SCHEDULE_REGEX: string
  WATCHED_LOGS_CATEGORIES: LogCategory[]
  TELEGRAM_CHAT_ID: string
  TELEGRAM_BASE_URL: string
}

/** Certificate and private key that make the server use HTTPS. */
export type TlsOptions = {
  cert: Buffer
  key: Buffer
}

/** The validated environment of the backend: the shared `EchoEnv` plus the backend-only settings. */
export type EchoBackEnv = EchoEnv & {
  HOST: string
  PORT: number
  LOGS_DIR_PATH: string
  ALLOWED_DOMAIN: string
  COOKIE_NAME: string
  COOKIE_SERIALIZE_OPTIONS: CookieSerializeOptions
  LOGS_CRON_OPTIONS?: LogsCronOptions
  TLS_OPTIONS?: TlsOptions
}

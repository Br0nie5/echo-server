import type { LogCategory } from '@echo/utilities'
import type { CookieSerializeOptions } from '@fastify/cookie'

/** Certificate and private key that make the server use HTTPS. */
export type TlsConfig = {
  cert: Buffer
  key: Buffer
}

/** What the HTTP server needs to listen, to say where it is reached and to serve the frontend. */
export type ServerConfig = {
  /** Display name of the server (`SERVER_NAME`). */
  serverName: string
  /** Origin both the API and the frontend are reached at (`SERVER_URL`). */
  serverUrl: string
  /** `<serverUrl>/api`. */
  apiUrl: string
  /** `<serverUrl>/app`. */
  appUrl: string
  host: string
  /** Port the server listens on (`HTTP_PORT`). */
  port: number
  /** Domain allowed by CORS, with its subdomains. */
  allowedDomain: string
  /** Set when the server uses HTTPS (`TLS_CERT_PATH` and `TLS_KEY_PATH`). */
  tls?: TlsConfig
  /** Directory holding the built frontend, served under `/app`. */
  frontendDistDirPath: string
}

/** What the authentication needs: whether it is on, its session cookie and where the users are stored. */
export type AuthConfig = {
  /** Whether the routes are protected by a login (`HAS_AUTHENTICATION`). */
  hasAuthentication: boolean
  /** Name of the cookie holding the JWT of the session. */
  cookieName: string
  cookieSerializeOptions: CookieSerializeOptions
  /** File of the SQLite database holding the users. */
  usersDbFilePath: string
}

/** What the backend needs to report its own diagnostics as logs. */
export type SelfLogsConfig = {
  /** Whether the self logs are stored (`SELF_LOGS_ENABLED`). */
  isEnabled: boolean
  /** Number of days a stored self log is kept (`SELF_LOGS_RETENTION_DAYS`). */
  retentionDays: number
  /** Directory holding the self-log files, inside the logs directory so they are read back like any other log. */
  selfLogsDirPath: string
  /** Name of the self-log file the lines of the log files that hold no log are reported to, with its extension. */
  parseLogFileSelfLogFileName: string
  /** Name of the self-log file the problem logs that could not be notified are reported to, with its extension. */
  logsNotifierSelfLogFileName: string
  /** File remembering the last `job_id` the self logs were written with. */
  sessionFilePath: string
}

/** What the cron notifying the problem logs needs, the channel it notifies through apart (`NotificationConfig`). */
export type LogsNotifierConfig = {
  /** Cron expression saying when the logs are checked (`LOGS_NOTIFIER_SCHEDULE_REGEX`). */
  schedule: string
  /** Categories that make a log a problem log (`LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES`). */
  watchedLogsCategories: LogCategory[]
  /** Luxon zone the dates of the messages are shown in (`LOGS_NOTIFIER_TIMEZONE`). */
  notifierTimezone: string
  /** Name the messages say the logs come from (`SERVER_NAME`). */
  serverName: string
  /** File remembering when the logs were last checked. */
  lastLogsCheckFilePath: string
}

/** What reading the logs needs, with the settings of the features built on top of them. */
export type LogsConfig = {
  /** Directory the log files are read from, at any depth (`LOGS_DIR_PATH`). */
  logsDirPath: string
  /** Extension, with its dot, a file of the logs directory must have to be read as a log file. */
  logFileExtension: string
  selfLogs: SelfLogsConfig
  /**
   * Missing when the cron notifying the problem logs is not configured, or when there is no
   * `NotificationConfig` to notify with, which disables it.
   */
  logsNotifier?: LogsNotifierConfig
}

/** What sending a notification needs: the Telegram chat it goes to. */
export type NotificationConfig = {
  /** Chat the messages are sent to (`TELEGRAM_CHAT_ID`). */
  telegramChatId: string
  /** URL of the Telegram bot API, token included (`TELEGRAM_BASE_URL`). */
  telegramBaseUrl: string
  /** Maximum length of a Telegram message. */
  telegramMessageSizeLimit: number
}

/**
 * The whole configuration of the backend, split by what uses it.
 *
 * It is built once, by `loadBackConfig`, from the environment variables and from constants. Each
 * part of the backend is given the one config it needs, and reads every setting, path and file
 * name from it:
 *
 * ```ts
 * const config = loadBackConfig()
 * const fileLogsApi = createFileLogsApi(config.logs)
 * const selfFileLogApi = createSelfFileLogApi(config.logs.selfLogs)
 * ```
 *
 * A value needed in two places is in both configs (`serverName` is in `ServerConfig` and
 * `LogsNotifierConfig`), so no function needs a second config for one field.
 */
export type BackConfig = {
  server: ServerConfig
  auth: AuthConfig
  logs: LogsConfig
  /** Missing when Telegram is not configured: the backend then has no channel to notify through. */
  notification?: NotificationConfig
}

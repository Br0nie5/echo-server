import type { LogCategory } from '@echo/utilities'
import type { CookieSerializeOptions } from '@fastify/cookie'

/** Certificate and private key that make the server use HTTPS, as the text of their PEM files. */
export type TlsConfig = {
  cert: string
  key: string
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
  /** Path the routes of the API are served under: the path of `apiUrl`. */
  apiRoutePrefix: string
  /** Path the frontend is served under: the path of `appUrl`. */
  appRoutePrefix: string
  host: string
  /** Port the server listens on (`HTTP_PORT`). */
  port: number
  /** Domain allowed by CORS, with its subdomains: the registrable domain of `serverUrl`, or its host when it is a bare name or an IP address. */
  allowedDomain: string
  /** Set when the server uses HTTPS (`TLS_CERT_PATH` and `TLS_KEY_PATH`). */
  tls?: TlsConfig
  /** Directory holding the built frontend, served under `appRoutePrefix`. */
  frontendDistDirPath: string
}

/** What the authentication needs: its session cookie and where the users are stored. */
export type AuthConfig = {
  /** Name of the cookie holding the JWT of the session. */
  cookieName: string
  cookieSerializeOptions: CookieSerializeOptions
  /** File of the SQLite database holding the users. */
  usersDbFilePath: string
}

/** What the backend needs to store the diagnostics it reports about itself. */
export type SelfReportsConfig = {
  /** Number of days a stored self report is kept (`SELF_REPORTS_RETENTION_DAYS`). */
  retentionDays: number
  /** Group the self reports are shown under in the app, among the other logs: the name of the server (`SERVER_NAME`), made safe for a path. */
  selfReportsGroupName: string
  /** Directory holding the self-report files, inside `SERVER_LOGS_DIR_PATH`, which the logs are read from too, so they are read back like any other log. */
  selfReportsDirPath: string
  /** Name of the self-report file the lines of the log files that hold no log are reported to, with its extension. */
  parseLogFileSelfReportFileName: string
  /** Name of the self-report file the problem logs that could not be notified are reported to, with its extension. */
  logsNotifierSelfReportFileName: string
  /** File remembering the last `job_id` the self reports were written with. */
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
  /**
   * Directories the log files are read from, at any depth: the watched one (`LOGS_DIR_PATH`), then
   * the one the self reports are stored under (`SERVER_LOGS_DIR_PATH`) when they are enabled.
   */
  logsDirsPaths: string[]
  /** Extension, with its dot, a file of a logs directory must have to be read as a log file. */
  logFileExtension: string
  /**
   * Name of the directory scripts put their log files in, next to what they log about. It only
   * holds the files, so it is left out of the name of their group.
   */
  logFilesDirName: string
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
 * const logsFilesApi = createLogsFilesApi(config.logs)
 * const usersDb = await createUsersDb(config.auth)
 * ```
 *
 * `auth`, `selfReports` and `notification` are missing when what they configure is disabled: whoever takes
 * one is only built when it is there.
 *
 * A value needed in two places is in both configs (`serverName` is in `ServerConfig` and
 * `LogsNotifierConfig`), so no function needs a second config for one field.
 */
export type BackConfig = {
  server: ServerConfig
  /** Missing when the authentication is disabled (`HAS_AUTHENTICATION`): the routes are then open to anyone. */
  auth?: AuthConfig
  logs: LogsConfig
  /** Missing when the self reports are disabled (`SAVE_SELF_REPORTS_TO_FILE`): the backend then stores none. */
  selfReports?: SelfReportsConfig
  /** Missing when Telegram is not configured: the backend then has no channel to notify through. */
  notification?: NotificationConfig
}

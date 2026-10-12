import type { LogLevel } from '@echo/utilities'
import type { CookieSerializeOptions } from '@fastify/cookie'

/** Certificate and private key that make the server use HTTPS, as the text of their PEM files. */
export type TlsConfig = {
  cert: string
  key: string
}

/** What the HTTP server needs to listen, to know the paths it is reached under and to serve the frontend. */
export type ServerConfig = {
  /** Display name of the server (`SERVER_NAME`). */
  serverName: string
  /**
   * Path a reverse proxy serves Echo under (`BASE_PATH`), without its trailing slash: `/echo` when
   * Echo is reached at `https://domain.com/echo`, an empty string at the root of its origin.
   *
   * The proxy may forward a request with it or without it: the server takes both, and serves its
   * routes below it.
   */
  basePath: string
  /** Path the routes of the API are served under, below `basePath`. */
  apiRoutePrefix: string
  /** Path the frontend is served under, below `basePath`. */
  appRoutePrefix: string
  /** Path the documentation of the API is served under, below `basePath`. */
  documentationRoutePrefix: string
  /** Whether the documentation of the API is served (`HAS_DOCUMENTATION_ROUTE`). */
  hasDocumentationRoute: boolean
  host: string
  /** Port the server listens on (`HTTP_PORT`). */
  port: number
  /**
   * Reverse proxies whose `X-Forwarded-*` headers the server believes (`TRUSTED_PROXIES`): the
   * protocol, the host and the address of a request they forward are those of these headers. Each
   * one is an IP address, a range of them in CIDR notation, or a named range (`loopback`,
   * `linklocal`, `uniquelocal`).
   *
   * Missing, whatever sends the request is believed. A client reaching the server without a proxy
   * then writes these headers itself: the protocol and the host they give are believed all the
   * same, but not the address, which nothing that protects the server may rely on.
   */
  trustedProxies?: string[]
  /** Set when the server uses HTTPS (`TLS_CERT_PATH` and `TLS_KEY_PATH`). */
  tls?: TlsConfig
  /** Directory holding the built frontend, served under `appRoutePrefix`. */
  frontendDistDirPath: string
}

/** What the authentication needs: its session, its cookie, its limits and where the users are stored. */
export type AuthConfig = {
  /** How long a session lasts, both its cookie and its JWT. */
  sessionDurationSeconds: number
  /**
   * Limit of the login and sign-up attempts, so passwords cannot be guessed at speed: how many
   * times credentials may be sent from one address within a time window.
   */
  credentialsAttemptsLimit: {
    maxAttempts: number
    timeWindowMilliseconds: number
  }
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
  /** File remembering the last `jobId` the self reports were written with. */
  sessionFilePath: string
}

/** What the cron notifying the problem logs needs, the channel it notifies through apart (`NotificationConfig`). */
export type LogsNotifierConfig = {
  /** Cron expression saying when the logs are checked (`LOGS_NOTIFIER_SCHEDULE`). */
  schedule: string
  /** Levels that make a log a problem log (`LOGS_NOTIFIER_WATCHED_LOGS_LEVELS`). */
  watchedLogsLevels: LogLevel[]
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

/** What sending a notification needs: the Telegram bot sending it and the chat it goes to. */
export type NotificationConfig = {
  /** Chat the messages are sent to (`TELEGRAM_CHAT_ID`). */
  telegramChatId: string
  /** Token of the bot the messages are sent by (`TELEGRAM_BOT_TOKEN`). A secret. */
  telegramBotToken: string
  /** Base URL of the Telegram bot API, without the token. */
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
 * const config = await loadBackConfig(filesService)
 * const logsFilesApi = createLogsFilesApi(config.logs, filesService)
 * const notifierService = createNotifierService(config.notification)
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

import type { AuthConfig } from '../../shared/config/authConfig.js'
import type { LogsNotifierConfig } from '../../shared/config/logsNotifierConfig.js'

/** Certificate and private key that make the server use HTTPS, as the text of their PEM files. */
export type TlsSettings = {
  cert: string
  key: string
}

/** What the HTTP server needs to listen, to know the paths it is reached under and to serve the frontend. */
export type ServerSettings = {
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
  tls?: TlsSettings
  /** Directory holding the built frontend, served under `appRoutePrefix`. */
  frontendDistDirPath: string
}

/** The config of the authentication, and where its accounts are stored. */
export type AuthSettings = {
  config: AuthConfig
  /** File of the SQLite database holding the users. */
  usersDbFilePath: string
}

/** Where one part of the backend stores the diagnostics it reports about itself. */
export type SelfReportsSettings = {
  /** Number of days a stored self report is kept (`SELF_REPORTS_RETENTION_DAYS`). */
  retentionDays: number
  /** Directory holding the self-report files, inside `SELF_REPORTS_DIR_PATH` and named after the server (`SERVER_NAME`). */
  dirPath: string
  /** Name, with its extension, of the file of `dirPath` the self reports are stored in. */
  fileName: string
  /** File remembering the id of the last session the self reports of `fileName` were written during. */
  sessionFilePath: string
  /**
   * Whether a problem is stored once, as it was first reported, for as long as its self report is
   * kept: what is reported again and again at each read is, what is reported when it happens is
   * not.
   */
  isEachProblemStoredOnce: boolean
}

/** The config of the cron notifying the watched logs, and where it remembers its last check. */
export type LogsNotifierSettings = {
  config: LogsNotifierConfig
  /** File remembering when the logs were last checked. */
  lastLogsCheckFilePath: string
}

/** Where the logs are read from, with the settings of the features built on top of them. */
export type LogsSettings = {
  /** Directory the log files are read from, at any depth (`LOGS_DIR_PATH`). */
  logsDirPath: string
  /** Extension, with its dot, a file of a logs directory must have to be read as a log file. */
  logFileExtension: string
  /**
   * Name of the directory scripts put their log files in, next to what they log about. It only
   * holds the files, so it is left out of the name of their group.
   */
  logFilesDirName: string
  /**
   * Missing when the cron notifying the watched logs is not configured, or when there are no
   * `NotificationSettings` to notify with, which disables it.
   */
  logsNotifier?: LogsNotifierSettings
}

/** What sending a notification needs: the Telegram bot sending it and the chat it goes to. */
export type NotificationSettings = {
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
 * Everything the backend is set up with, split by what uses it.
 *
 * It is built once, by `loadSettings`, from the environment variables and from constants, and it
 * stays in the composition root: `buildServer` and what it registers read it, and nothing else
 * does. A setting is either a config, which a module is given as it is (the `config` of
 * `AuthSettings` and of `LogsNotifierSettings`), or what an implementation needs (a path, a file
 * name, a token), which is handed to that implementation value by value:
 *
 * ```ts
 * const settings = await loadSettings(filesService)
 * const usersDb = await createUsersDb({ usersDbFilePath: settings.auth.usersDbFilePath }, filesService)
 * const controller = createAuthController(authRepository, settings.auth.config)
 * ```
 *
 * `auth`, `parseLogsSelfReports`, `notificationsSelfReports` and `notification` are missing when
 * what they set up is disabled: whoever takes one is only built when it is there.
 */
export type Settings = {
  server: ServerSettings
  /** Missing when the authentication is disabled (`HAS_AUTHENTICATION`): the routes are then open to anyone. */
  auth?: AuthSettings
  logs: LogsSettings
  /**
   * Where the lines of the log files that hold no log are reported.
   *
   * Missing when the self reports are disabled, that is when nothing uses them: they are stored
   * only when they are shown among the logs (`INCLUDE_SELF_REPORTS_IN_LOGS`), as logs of their
   * own. A line is reported at each read of its file, so it is stored once.
   */
  parseLogsSelfReports?: SelfReportsSettings
  /**
   * Where the notifications that could not be sent are reported. It has the directory and the
   * retention of `parseLogsSelfReports`, and a file and a session file of its own. Each failure is
   * stored, even one that already happened.
   *
   * Missing when the self reports are disabled.
   */
  notificationsSelfReports?: SelfReportsSettings
  /** Missing when Telegram is not configured: the backend then has no channel to notify through. */
  notification?: NotificationSettings
}

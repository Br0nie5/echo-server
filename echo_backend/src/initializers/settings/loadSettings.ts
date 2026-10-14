import path from 'path'
import { fileURLToPath } from 'url'

import {
  addEnvNameToError,
  apiRoutePrefix,
  appRoutePrefix,
  parseBoolean,
  parseConfig,
  parseRequiredEnv,
  requireEnv
} from '@echo/utilities'
import dotenv from 'dotenv'

import type { FilesService } from '../../shared/services/files.service.js'

import type { Settings } from './settings.js'
import { createCookieSerializeOptions } from './utils/createCookieSerializeOptions.js'
import { createSelfReportsDirPath } from './utils/createSelfReportsDirPath.js'
import { createSessionCookieName } from './utils/createSessionCookieName.js'
import { parseBasePath } from './utils/parseBasePath.js'
import { parseDaysNumber } from './utils/parseDaysNumber.js'
import { parseHttpPort } from './utils/parseHttpPort.js'
import { parseLogsNotifierSettings } from './utils/parseLogsNotifierSettings.js'
import { parseNotificationSettings } from './utils/parseNotificationSettings.js'
import { parseTlsSettings } from './utils/parseTlsSettings.js'
import { parseTrustedProxies } from './utils/parseTrustedProxies.js'

/** ESM has no `__dirname`, so it is rebuilt from the module URL. */
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const REPOSITORY_ROOT_PATH = path.join(__dirname, '../../../..')
/**
 * Directory holding the persistent data of the backend (users database, cron checkpoint,
 * self-reports sessions).
 */
const DATA_DIR_PATH = path.join(REPOSITORY_ROOT_PATH, 'data')

/**
 * Extension of the files the logs are read from, and of the files the self reports are written
 * to.
 */
const LOG_FILE_EXTENSION = '.jsonl'

/** Name of the directory scripts put their log files in. */
const LOG_FILES_DIR_NAME = 'logs'

/** Path the documentation of the API is served under, below `BASE_PATH`. */
const DOCUMENTATION_ROUTE_PREFIX = '/documentation'

/** How long a session lasts: one day. */
const SESSION_DURATION_SECONDS = 24 * 60 * 60

/** Login and sign-up attempts allowed from one address: 5 a minute. */
const CREDENTIALS_ATTEMPTS_LIMIT = { maxAttempts: 5, timeWindowMilliseconds: 60 * 1000 }

/** Base URL of the Telegram bot API, which the path of a bot is appended to. */
const TELEGRAM_BASE_URL = 'https://api.telegram.org'

/** Maximum length of a message, set by the Telegram bot API. */
const TELEGRAM_MESSAGE_SIZE_LIMIT = 4096

/** How long a request to the Telegram bot API may take: 10 seconds. */
const TELEGRAM_REQUEST_TIMEOUT_MILLISECONDS = 10 * 1000

/**
 * Builds the settings of the backend, the configs of its modules included, from `processEnv` (the
 * environment of the process by default), from the constants of the backend (paths, file names,
 * cookie options) and from the files some variables point to, read through `filesService` (the
 * TLS certificate and key).
 *
 * `.env.<mode>` is loaded into `processEnv` first, without overriding the variables already set;
 * `<mode>` is `production` when `NODE_ENV` is, `development` otherwise. Each variable is then read
 * by its parser (`utils/`). Throws as soon as one of them does, that is on the first required
 * variable that is missing or invalid, so a misconfigured server never starts. The variables of a
 * part of the backend that is disabled are not read, so they stop nothing.
 *
 * Three required booleans switch a part of the backend on. The authentication is left out unless
 * `HAS_AUTHENTICATION` is `true`. The self reports are shown among the logs, which are read from
 * `LOGS_DIR_PATH`, only when `INCLUDE_SELF_REPORTS_IN_LOGS` is `true`. They are stored only when
 * something uses them, so they are left out unless it is: `SELF_REPORTS_RETENTION_DAYS` and
 * `SELF_REPORTS_DIR_PATH` are then required, and they are stored in
 * `<SELF_REPORTS_DIR_PATH>/<SERVER_NAME>`. The documentation of the API is served only when
 * `HAS_DOCUMENTATION_ROUTE` is `true`.
 *
 * The notifications have no switch: they are left out, hence disabled, unless `TELEGRAM_CHAT_ID`
 * and `TELEGRAM_BOT_TOKEN` are both set. The cron notifying the watched logs and the self reports
 * of the notifications are left out with them, since there would be nothing to notify through,
 * and the three `LOGS_NOTIFIER_*` variables of the cron are required only when they are set.
 *
 * It is meant to be called once, when the server starts, the settings then being handed to what
 * builds it:
 *
 * ```ts
 * const filesService = createFilesService()
 * const settings = await loadSettings(filesService)
 * const server = await buildServer(settings, filesService)
 * await server.listen({ port: settings.server.port, host: settings.server.host })
 * ```
 */
export const loadSettings = async (
  filesService: FilesService,
  processEnv: NodeJS.ProcessEnv = process.env
): Promise<Settings> => {
  const mode = processEnv.NODE_ENV === 'production' ? processEnv.NODE_ENV : 'development'
  dotenv.config({ path: `.env.${mode}`, processEnv, override: false, quiet: true })

  const config = parseConfig({ ...processEnv })

  const basePath = parseBasePath(processEnv.BASE_PATH, [
    apiRoutePrefix,
    appRoutePrefix,
    DOCUMENTATION_ROUTE_PREFIX
  ])

  const logsDirPath = requireEnv(processEnv, 'LOGS_DIR_PATH')

  const areSelfReportsIncludedInLogs = parseRequiredEnv(
    processEnv,
    'INCLUDE_SELF_REPORTS_IN_LOGS',
    parseBoolean
  )
  const areSelfReportsEnabled = areSelfReportsIncludedInLogs

  const selfReportsRootDirPath =
    areSelfReportsEnabled && requireEnv(processEnv, 'SELF_REPORTS_DIR_PATH')
  const sharedSelfReportsSettings = selfReportsRootDirPath
    ? {
        retentionDays: parseRequiredEnv(processEnv, 'SELF_REPORTS_RETENTION_DAYS', parseDaysNumber),
        rootDirPath: selfReportsRootDirPath,
        dirPath: createSelfReportsDirPath(selfReportsRootDirPath, config.serverName)
      }
    : undefined

  const notification = parseNotificationSettings(processEnv, {
    telegramBaseUrl: TELEGRAM_BASE_URL,
    telegramMessageSizeLimit: TELEGRAM_MESSAGE_SIZE_LIMIT,
    telegramRequestTimeoutMilliseconds: TELEGRAM_REQUEST_TIMEOUT_MILLISECONDS
  })

  return {
    server: {
      serverName: config.serverName,
      basePath,
      apiRoutePrefix,
      appRoutePrefix,
      documentationRoutePrefix: DOCUMENTATION_ROUTE_PREFIX,
      hasDocumentationRoute: parseRequiredEnv(processEnv, 'HAS_DOCUMENTATION_ROUTE', parseBoolean),
      host: '0.0.0.0',
      port: parseRequiredEnv(processEnv, 'HTTP_PORT', parseHttpPort),
      trustedProxies: addEnvNameToError('TRUSTED_PROXIES', () =>
        parseTrustedProxies(processEnv.TRUSTED_PROXIES)
      ),
      tls: await parseTlsSettings(processEnv, filesService),
      frontendDistDirPath: path.join(REPOSITORY_ROOT_PATH, 'echo_frontend', 'dist')
    },
    auth: config.hasAuthentication
      ? {
          config: {
            sessionDurationSeconds: SESSION_DURATION_SECONDS,
            credentialsAttemptsLimit: CREDENTIALS_ATTEMPTS_LIMIT,
            cookieName: createSessionCookieName(config.serverName),
            cookieSerializeOptions: createCookieSerializeOptions(basePath, SESSION_DURATION_SECONDS)
          },
          usersDbFilePath: path.join(DATA_DIR_PATH, 'users.db')
        }
      : undefined,
    logs: {
      logsDirPath,
      logFileExtension: LOG_FILE_EXTENSION,
      logFilesDirName: LOG_FILES_DIR_NAME,
      logsNotifier:
        notification &&
        parseLogsNotifierSettings(processEnv, {
          serverName: config.serverName,
          lastLogsCheckFilePath: path.join(DATA_DIR_PATH, 'last_logs_check.json')
        })
    },
    parseLogsSelfReports: sharedSelfReportsSettings && {
      ...sharedSelfReportsSettings,
      fileName: `parseLogs${LOG_FILE_EXTENSION}`,
      sessionFilePath: path.join(DATA_DIR_PATH, 'parse_logs_self_reports_session.json'),
      isEachProblemStoredOnce: true
    },
    notificationsSelfReports: notification &&
      sharedSelfReportsSettings && {
        ...sharedSelfReportsSettings,
        fileName: `notifications${LOG_FILE_EXTENSION}`,
        sessionFilePath: path.join(DATA_DIR_PATH, 'notifications_self_reports_session.json'),
        isEachProblemStoredOnce: false
      },
    notification
  }
}

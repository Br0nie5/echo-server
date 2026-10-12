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

import type { FilesService } from '../services/files.service.js'

import type { BackConfig } from './backConfig.js'
import { createCookieSerializeOptions } from './utils/createCookieSerializeOptions.js'
import { createSelfReportsDirPath } from './utils/createSelfReportsDirPath.js'
import { createSelfReportsGroupName } from './utils/createSelfReportsGroupName.js'
import { createSessionCookieName } from './utils/createSessionCookieName.js'
import { parseBasePath } from './utils/parseBasePath.js'
import { parseDaysNumber } from './utils/parseDaysNumber.js'
import { parseHttpPort } from './utils/parseHttpPort.js'
import { parseLogsNotifierConfig } from './utils/parseLogsNotifierConfig.js'
import { parseNotificationConfig } from './utils/parseNotificationConfig.js'
import { parseTlsConfig } from './utils/parseTlsConfig.js'
import { parseTrustedProxies } from './utils/parseTrustedProxies.js'

/** ESM has no `__dirname`, so it is rebuilt from the module URL. */
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const REPOSITORY_ROOT_PATH = path.join(__dirname, '../../../..')
/** Directory holding the persistent data of the backend (users database, cron checkpoint, self-reports session). */
const DATA_DIR_PATH = path.join(REPOSITORY_ROOT_PATH, 'data')

/** Extension of the files the logs are read from, and of the files the self reports are written to. */
const LOG_FILE_EXTENSION = '.jsonl'

/** Name of the directory scripts put their log files in, and the backend its self-report files. */
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

/**
 * Builds the configuration of the backend from `processEnv` (the environment of the process by
 * default), from the constants of the backend (paths, file names, cookie settings) and from the
 * files some variables point to, read through `filesService` (the TLS certificate and key).
 *
 * `.env.<mode>` is loaded into `processEnv` first, without overriding the variables already set;
 * `<mode>` is `production` when `NODE_ENV` is, `development` otherwise. Each variable is then read
 * by its parser (`utils/`). Throws as soon as one of them does, that is on the first required
 * variable that is missing or invalid, so a misconfigured server never starts. The variables of a
 * part of the backend that is disabled are not read, so they stop nothing.
 *
 * Three required booleans switch a part of the backend on. The authentication is left out unless
 * `HAS_AUTHENTICATION` is `true`. The self reports are left out unless `SAVE_SELF_REPORTS_TO_FILE`
 * is `true`: `SELF_REPORTS_RETENTION_DAYS` is then required, they are stored under
 * `SERVER_LOGS_DIR_PATH`, and the logs are read from it too, next to `LOGS_DIR_PATH`. The
 * documentation of the API is served only when `HAS_DOCUMENTATION_ROUTE` is `true`.
 *
 * The notifications have no switch: they are left out, hence disabled, unless `TELEGRAM_CHAT_ID`
 * and `TELEGRAM_BOT_TOKEN` are both set. The cron notifying the problem logs is left out with
 * them, since it would have no channel to notify through, and its three `LOGS_NOTIFIER_*`
 * variables are required only when they are set.
 *
 * It is meant to be called once, when the server starts, the config then being handed down:
 *
 * ```ts
 * const filesService = createFilesService()
 * const config = await loadBackConfig(filesService)
 * const server = await buildServer(config, filesService)
 * await server.listen({ port: config.server.port, host: config.server.host })
 * ```
 */
export const loadBackConfig = async (
  filesService: FilesService,
  processEnv: NodeJS.ProcessEnv = process.env
): Promise<BackConfig> => {
  const mode = processEnv.NODE_ENV === 'production' ? processEnv.NODE_ENV : 'development'
  dotenv.config({ path: `.env.${mode}`, processEnv, override: false, quiet: true })

  const config = parseConfig({ ...processEnv })

  const basePath = parseBasePath(processEnv.BASE_PATH, [
    apiRoutePrefix,
    appRoutePrefix,
    DOCUMENTATION_ROUTE_PREFIX
  ])

  const logsDirPath = requireEnv(processEnv, 'LOGS_DIR_PATH')
  const serverLogsRootDirPath = requireEnv(processEnv, 'SERVER_LOGS_DIR_PATH')

  const areSelfReportsEnabled = parseRequiredEnv(
    processEnv,
    'SAVE_SELF_REPORTS_TO_FILE',
    parseBoolean
  )

  const selfReportsGroupName = createSelfReportsGroupName(config.SERVER_NAME)

  const notification = parseNotificationConfig(processEnv, {
    telegramBaseUrl: TELEGRAM_BASE_URL,
    telegramMessageSizeLimit: TELEGRAM_MESSAGE_SIZE_LIMIT
  })

  return {
    server: {
      serverName: config.SERVER_NAME,
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
      tls: await parseTlsConfig(processEnv, filesService),
      frontendDistDirPath: path.join(REPOSITORY_ROOT_PATH, 'echo_frontend', 'dist')
    },
    auth: config.HAS_AUTHENTICATION
      ? {
          sessionDurationSeconds: SESSION_DURATION_SECONDS,
          credentialsAttemptsLimit: CREDENTIALS_ATTEMPTS_LIMIT,
          cookieName: createSessionCookieName(config.SERVER_NAME),
          cookieSerializeOptions: createCookieSerializeOptions(basePath, SESSION_DURATION_SECONDS),
          usersDbFilePath: path.join(DATA_DIR_PATH, 'users.db')
        }
      : undefined,
    logs: {
      logsDirsPaths: areSelfReportsEnabled ? [logsDirPath, serverLogsRootDirPath] : [logsDirPath],
      logFileExtension: LOG_FILE_EXTENSION,
      logFilesDirName: LOG_FILES_DIR_NAME,
      logsNotifier:
        notification &&
        parseLogsNotifierConfig(processEnv, {
          serverName: config.SERVER_NAME,
          lastLogsCheckFilePath: path.join(DATA_DIR_PATH, 'last_logs_check.json')
        })
    },
    selfReports: areSelfReportsEnabled
      ? {
          retentionDays: parseRequiredEnv(
            processEnv,
            'SELF_REPORTS_RETENTION_DAYS',
            parseDaysNumber
          ),
          selfReportsGroupName,
          selfReportsDirPath: createSelfReportsDirPath(
            serverLogsRootDirPath,
            selfReportsGroupName,
            LOG_FILES_DIR_NAME
          ),
          parseLogFileSelfReportFileName: `parseLogFile${LOG_FILE_EXTENSION}`,
          logsNotifierSelfReportFileName: `logsNotifier${LOG_FILE_EXTENSION}`,
          sessionFilePath: path.join(DATA_DIR_PATH, 'self_reports_session.json')
        }
      : undefined,
    notification
  }
}

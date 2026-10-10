import path from 'path'
import { fileURLToPath } from 'url'

import { apiRoutePrefix, appRoutePrefix, parseConfig } from '@echo/utilities'
import dotenv from 'dotenv'

import type { FilesService } from '../services/files.service.js'

import type { BackConfig } from './backConfig.js'
import { addEnvNameToError } from './utils/addEnvNameToError.js'
import { createSelfReportsDirPath } from './utils/createSelfReportsDirPath.js'
import { createSelfReportsGroupName } from './utils/createSelfReportsGroupName.js'
import { parseAllowedDomain } from './utils/parseAllowedDomain.js'
import { parseBasePath } from './utils/parseBasePath.js'
import { parseCookieSerializeOptions } from './utils/parseCookieSerializeOptions.js'
import { parseDaysNumber } from './utils/parseDaysNumber.js'
import { parseHttpPort } from './utils/parseHttpPort.js'
import { parseLogsNotifierConfig } from './utils/parseLogsNotifierConfig.js'
import { parseNotificationConfig } from './utils/parseNotificationConfig.js'
import { parseOptionalBoolean } from './utils/parseOptionalBoolean.js'
import { parseServerUrls } from './utils/parseServerUrls.js'
import { parseTlsConfig } from './utils/parseTlsConfig.js'
import { requireEnv } from './utils/requireEnv.js'

/** ESM has no `__dirname`, so it is rebuilt from the module URL. */
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const REPOSITORY_ROOT_PATH = path.join(__dirname, '../../../..')
/** Directory holding the persistent data of the backend (users database, cron checkpoint, self-reports session). */
const DATA_DIR_PATH = path.join(REPOSITORY_ROOT_PATH, 'data')

/** Extension of the files the logs are read from, and of the files the self reports are written to. */
const LOG_FILE_EXTENSION = '.jsonl'

/** Name of the directory scripts put their log files in, and the backend its self-report files. */
const LOG_FILES_DIR_NAME = 'log'

/** Path the documentation of the API is served under, below the path of `SERVER_URL`. */
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
 * variable that is missing or invalid, so a misconfigured server never starts. The notifications
 * and the cron notifying the problem logs are the exception: each is left out of the config, hence
 * disabled, when one of its required variables is, and the cron is left out too when the
 * notifications are, since it would have no channel to notify through. The self reports are left
 * out unless `SAVE_SELF_REPORTS_TO_FILE` is `true`: they are then stored under `SERVER_LOGS_DIR_PATH`,
 * which is always required, and the logs are read from it too, next to `LOGS_DIR_PATH`. The
 * authentication is left out unless `HAS_AUTHENTICATION` is `true`.
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

  const { serverUrl, apiUrl, appUrl } = parseServerUrls(
    requireEnv(processEnv, 'SERVER_URL'),
    apiRoutePrefix,
    appRoutePrefix
  )
  const allowedDomain = parseAllowedDomain(serverUrl)
  const basePath = parseBasePath(serverUrl, [
    apiRoutePrefix,
    appRoutePrefix,
    DOCUMENTATION_ROUTE_PREFIX
  ])

  const logsDirPath = requireEnv(processEnv, 'LOGS_DIR_PATH')
  const serverLogsRootDirPath = requireEnv(processEnv, 'SERVER_LOGS_DIR_PATH')

  const areSelfReportsEnabled = addEnvNameToError('SAVE_SELF_REPORTS_TO_FILE', () =>
    parseOptionalBoolean(processEnv.SAVE_SELF_REPORTS_TO_FILE)
  )

  const selfReportsGroupName = createSelfReportsGroupName(config.SERVER_NAME)

  const notification = parseNotificationConfig(processEnv, {
    telegramBaseUrl: TELEGRAM_BASE_URL,
    telegramMessageSizeLimit: TELEGRAM_MESSAGE_SIZE_LIMIT
  })

  return {
    server: {
      serverName: config.SERVER_NAME,
      serverUrl,
      apiUrl,
      appUrl,
      basePath,
      apiRoutePrefix,
      appRoutePrefix,
      documentationRoutePrefix: DOCUMENTATION_ROUTE_PREFIX,
      host: '0.0.0.0',
      port: parseHttpPort(requireEnv(processEnv, 'HTTP_PORT')),
      allowedDomain,
      tls: await parseTlsConfig(processEnv, { serverUrl }, filesService),
      frontendDistDirPath: path.join(REPOSITORY_ROOT_PATH, 'echo_frontend', 'dist')
    },
    auth: config.HAS_AUTHENTICATION
      ? {
          sessionDurationSeconds: SESSION_DURATION_SECONDS,
          credentialsAttemptsLimit: CREDENTIALS_ATTEMPTS_LIMIT,
          // The brackets and the colons of an IPv6 address are not allowed in the name of a cookie.
          cookieName: `${allowedDomain.replace(/[^a-zA-Z0-9.-]/g, '_')}_access_token`,
          cookieSerializeOptions: parseCookieSerializeOptions(
            allowedDomain,
            serverUrl,
            basePath,
            SESSION_DURATION_SECONDS
          ),
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
          retentionDays: addEnvNameToError('SELF_REPORTS_RETENTION_DAYS', () =>
            parseDaysNumber(processEnv.SELF_REPORTS_RETENTION_DAYS, 10)
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

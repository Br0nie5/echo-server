import path from 'path'
import { fileURLToPath } from 'url'

import { parseEchoEnv } from '@echo/utilities'
import dotenv from 'dotenv'

import type { BackConfig } from './backConfig.js'
import { addEnvNameToError } from './utils/addEnvNameToError.js'
import { createSelfReportsDirPath } from './utils/createSelfReportsDirPath.js'
import { parseAllowedDomain } from './utils/parseAllowedDomain.js'
import { parseCookieSerializeOptions } from './utils/parseCookieSerializeOptions.js'
import { parseDaysNumber } from './utils/parseDaysNumber.js'
import { parseHttpPort } from './utils/parseHttpPort.js'
import { parseLogsNotifierConfig } from './utils/parseLogsNotifierConfig.js'
import { parseNotificationConfig } from './utils/parseNotificationConfig.js'
import { parseOptionalBoolean } from './utils/parseOptionalBoolean.js'
import { parseTlsConfig } from './utils/parseTlsConfig.js'
import { requireEnv } from './utils/requireEnv.js'

/** ESM has no `__dirname`, so it is rebuilt from the module URL. */
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const REPOSITORY_ROOT_PATH = path.join(__dirname, '../../../..')
/** Directory holding the persistent data of the backend (users database, cron checkpoint, self-reports session). */
const DATA_DIR_PATH = path.join(REPOSITORY_ROOT_PATH, 'data')

/** Extension of the files the logs are read from, and of the files the self reports are written to. */
const LOG_FILE_EXTENSION = '.jsonl'

/** Maximum length of a message, set by the Telegram bot API. */
const TELEGRAM_MESSAGE_SIZE_LIMIT = 4096

/**
 * Builds the configuration of the backend from `processEnv` (the environment of the process by
 * default) and from the constants of the backend (paths, file names, cookie settings).
 *
 * `.env.<mode>` is loaded into `processEnv` first, without overriding the variables already set;
 * `<mode>` is `production` when `NODE_ENV` is, `development` otherwise. Each variable is then read
 * by its parser (`utils/`). Throws as soon as one of them does, that is on the first required
 * variable that is missing or invalid, so a misconfigured server never starts. The notifications
 * and the cron notifying the problem logs are the exception: each is left out of the config, hence
 * disabled, when one of its required variables is, and the cron is left out too when the
 * notifications are, since it would have no channel to notify through.
 *
 * It is meant to be called once, when the server starts, the config then being handed down:
 *
 * ```ts
 * const config = loadBackConfig()
 * const server = await buildServer(config)
 * await server.listen({ port: config.server.port, host: config.server.host })
 * ```
 */
export const loadBackConfig = (processEnv: NodeJS.ProcessEnv = process.env): BackConfig => {
  const mode = processEnv.NODE_ENV === 'production' ? processEnv.NODE_ENV : 'development'
  dotenv.config({ path: `.env.${mode}`, processEnv, override: false, quiet: true })

  const echoEnv = parseEchoEnv({ ...processEnv })
  const allowedDomain = parseAllowedDomain(echoEnv.SERVER_URL)
  const logsDirPath = requireEnv(processEnv, 'LOGS_DIR_PATH')
  const notification = parseNotificationConfig(processEnv, {
    telegramMessageSizeLimit: TELEGRAM_MESSAGE_SIZE_LIMIT
  })

  return {
    server: {
      serverName: echoEnv.SERVER_NAME,
      serverUrl: echoEnv.SERVER_URL,
      apiUrl: echoEnv.API_URL,
      appUrl: echoEnv.APP_URL,
      host: '0.0.0.0',
      port: parseHttpPort(requireEnv(processEnv, 'HTTP_PORT')),
      allowedDomain,
      tls: parseTlsConfig(processEnv, { mode, serverUrl: echoEnv.SERVER_URL }),
      frontendDistDirPath: path.join(REPOSITORY_ROOT_PATH, 'echo_frontend', 'dist')
    },
    auth: {
      hasAuthentication: echoEnv.HAS_AUTHENTICATION,
      cookieName: `${allowedDomain}_access_token`,
      cookieSerializeOptions: parseCookieSerializeOptions(allowedDomain),
      usersDbFilePath: path.join(DATA_DIR_PATH, 'users.db')
    },
    logs: {
      logsDirPath,
      logFileExtension: LOG_FILE_EXTENSION,
      logsNotifier:
        notification &&
        parseLogsNotifierConfig(processEnv, {
          serverName: echoEnv.SERVER_NAME,
          lastLogsCheckFilePath: path.join(DATA_DIR_PATH, 'last_logs_check.json')
        })
    },
    selfReports: {
      isEnabled: addEnvNameToError('SELF_REPORTS_ENABLED', () =>
        parseOptionalBoolean(processEnv.SELF_REPORTS_ENABLED)
      ),
      retentionDays: addEnvNameToError('SELF_REPORTS_RETENTION_DAYS', () =>
        parseDaysNumber(processEnv.SELF_REPORTS_RETENTION_DAYS, 10)
      ),
      selfReportsDirPath: createSelfReportsDirPath(logsDirPath, echoEnv.SERVER_NAME),
      parseLogFileSelfReportFileName: `parseLogFile${LOG_FILE_EXTENSION}`,
      logsNotifierSelfReportFileName: `logsNotifier${LOG_FILE_EXTENSION}`,
      sessionFilePath: path.join(DATA_DIR_PATH, 'self_reports_session.json')
    },
    notification
  }
}

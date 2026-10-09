import path from 'path'
import { fileURLToPath } from 'url'

import { parseConfig } from '@echo/utilities'
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
 * notifications are, since it would have no channel to notify through. The self reports are left
 * out unless `SELF_REPORTS_ENABLED` is `true`: they are then stored under `SERVER_LOGS_DIR_PATH`,
 * which is always required, and the logs are read from it too, next to `LOGS_DIR_PATH`.
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

  const config = parseConfig({ ...processEnv })

  const allowedDomain = parseAllowedDomain(config.SERVER_URL)

  const logsDirPath = requireEnv(processEnv, 'LOGS_DIR_PATH')
  const serverLogsRootDirPath = requireEnv(processEnv, 'SERVER_LOGS_DIR_PATH')

  const areSelfReportsEnabled = addEnvNameToError('SELF_REPORTS_ENABLED', () =>
    parseOptionalBoolean(processEnv.SELF_REPORTS_ENABLED)
  )

  const notification = parseNotificationConfig(processEnv, {
    telegramMessageSizeLimit: TELEGRAM_MESSAGE_SIZE_LIMIT
  })

  return {
    server: {
      serverName: config.SERVER_NAME,
      serverUrl: config.SERVER_URL,
      apiUrl: config.API_URL,
      appUrl: config.APP_URL,
      apiRoutePrefix: new URL(config.API_URL).pathname,
      appRoutePrefix: new URL(config.APP_URL).pathname,
      host: '0.0.0.0',
      port: parseHttpPort(requireEnv(processEnv, 'HTTP_PORT')),
      allowedDomain,
      tls: parseTlsConfig(processEnv, { serverUrl: config.SERVER_URL }),
      frontendDistDirPath: path.join(REPOSITORY_ROOT_PATH, 'echo_frontend', 'dist')
    },
    auth: {
      hasAuthentication: config.HAS_AUTHENTICATION,
      // The brackets and the colons of an IPv6 address are not allowed in the name of a cookie.
      cookieName: `${allowedDomain.replace(/[^a-zA-Z0-9.-]/g, '_')}_access_token`,
      cookieSerializeOptions: parseCookieSerializeOptions(allowedDomain),
      usersDbFilePath: path.join(DATA_DIR_PATH, 'users.db')
    },
    logs: {
      logsDirsPaths: areSelfReportsEnabled ? [logsDirPath, serverLogsRootDirPath] : [logsDirPath],
      logFileExtension: LOG_FILE_EXTENSION,
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
          selfReportsDirPath: createSelfReportsDirPath(serverLogsRootDirPath, config.SERVER_NAME),
          parseLogFileSelfReportFileName: `parseLogFile${LOG_FILE_EXTENSION}`,
          logsNotifierSelfReportFileName: `logsNotifier${LOG_FILE_EXTENSION}`,
          sessionFilePath: path.join(DATA_DIR_PATH, 'self_reports_session.json')
        }
      : undefined,
    notification
  }
}

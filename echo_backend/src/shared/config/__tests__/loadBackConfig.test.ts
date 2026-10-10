import path from 'path'
import { fileURLToPath } from 'url'

import dotenv, { type DotenvConfigOptions } from 'dotenv'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { getMockFilesService } from '../../../test/mocks/filesService.js'
import { loadBackConfig } from '../loadBackConfig.js'

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }))

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TLS_CERT_PATH = '/certificates/echo.crt'
const TLS_KEY_PATH = '/certificates/echo.key'
const TLS_FILES_CONTENTS: Record<string, string> = {
  [TLS_CERT_PATH]: 'certificate content',
  [TLS_KEY_PATH]: 'private key content'
}

const REPOSITORY_ROOT_PATH = path.join(__dirname, '../../../../..')
const DATA_DIR_PATH = path.join(REPOSITORY_ROOT_PATH, 'data')

const filesService = getMockFilesService()

const REQUIRED_ENV: NodeJS.ProcessEnv = {
  SERVER_NAME: 'Echo',
  SERVER_URL: 'http://localhost:5173',
  HAS_AUTHENTICATION: 'false',
  HTTP_PORT: '4000',
  LOGS_DIR_PATH: '/some/path',
  SERVER_LOGS_DIR_PATH: '/server/logs/path'
}

/** Makes `dotenv` load `variables` when it is asked for the env file found at `envFilePath`, and nothing for any other file. */
const stubEnvFile = (envFilePath: string, variables: NodeJS.ProcessEnv): void => {
  vi.mocked(dotenv.config).mockImplementation((options?: DotenvConfigOptions) => {
    if (options?.path === envFilePath && options.processEnv && options.override === false) {
      Object.assign(options.processEnv, { ...variables, ...options.processEnv })
    }
    return {}
  })
}

describe('loadBackConfig', () => {
  beforeEach(() => {
    vi.mocked(dotenv.config).mockReset()
    filesService.getFileContent.mockImplementation(async (filePath) => TLS_FILES_CONTENTS[filePath])
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('environment', () => {
    it('should load .env.development when NODE_ENV is not production', async () => {
      stubEnvFile('.env.development', { ...REQUIRED_ENV, SERVER_NAME: 'Development Echo' })

      const config = await loadBackConfig(filesService, { NODE_ENV: 'test' })

      expect(config.server.serverName).toBe('Development Echo')
    })

    it('should load .env.production when NODE_ENV is production', async () => {
      stubEnvFile('.env.production', { ...REQUIRED_ENV, SERVER_NAME: 'Production Echo' })

      const config = await loadBackConfig(filesService, { NODE_ENV: 'production' })

      expect(config.server.serverName).toBe('Production Echo')
    })

    it('should keep the variables already set over the ones of the env file', async () => {
      stubEnvFile('.env.development', { ...REQUIRED_ENV, SERVER_NAME: 'Development Echo' })

      const config = await loadBackConfig(filesService, { SERVER_NAME: 'Already Set Echo' })

      expect(config.server.serverName).toBe('Already Set Echo')
    })

    it('should read the environment of the process by default', async () => {
      Object.entries(REQUIRED_ENV).forEach(([key, value]) => vi.stubEnv(key, value))
      vi.stubEnv('SERVER_NAME', 'Process Echo')

      const config = await loadBackConfig(filesService)

      expect(config.server.serverName).toBe('Process Echo')
    })
  })

  it.each([
    { variable: 'SERVER_NAME', value: '' },
    { variable: 'SERVER_URL', value: 'not-a-url' },
    { variable: 'HAS_AUTHENTICATION', value: 'maybe' },
    { variable: 'HTTP_PORT', value: 'not-a-number' },
    { variable: 'LOGS_DIR_PATH', value: '' },
    { variable: 'SERVER_LOGS_DIR_PATH', value: '' },
    { variable: 'SAVE_SELF_REPORTS_TO_FILE', value: 'maybe' },
    { variable: 'SELF_REPORTS_RETENTION_DAYS', value: '0' }
  ])(
    'should throw when the parser of $variable throws on "$value"',
    async ({ variable, value }) => {
      await expect(
        loadBackConfig(filesService, {
          ...REQUIRED_ENV,
          SAVE_SELF_REPORTS_TO_FILE: 'true',
          [variable]: value
        })
      ).rejects.toThrow()
    }
  )

  it('should build the whole config, with its defaults, from the required variables alone', async () => {
    expect(await loadBackConfig(filesService, { ...REQUIRED_ENV })).toStrictEqual({
      server: {
        serverName: 'Echo',
        serverUrl: 'http://localhost:5173',
        apiUrl: 'http://localhost:5173/api',
        appUrl: 'http://localhost:5173/app',
        apiRoutePrefix: '/api',
        appRoutePrefix: '/app',
        host: '0.0.0.0',
        port: 4000,
        allowedDomain: 'localhost',
        tls: undefined,
        frontendDistDirPath: path.join(REPOSITORY_ROOT_PATH, 'echo_frontend', 'dist')
      },
      auth: undefined,
      logs: {
        logsDirsPaths: ['/some/path'],
        logFileExtension: '.jsonl',
        logFilesDirName: 'log',
        logsNotifier: undefined
      },
      selfReports: undefined,
      notification: undefined
    })
  })

  it('should build the whole config from every possible variables', async () => {
    const config = await loadBackConfig(filesService, {
      NODE_ENV: 'production',
      SERVER_NAME: 'Docker Prod',
      SERVER_URL: 'https://allowed-domain.com:3700',
      HAS_AUTHENTICATION: 'true',
      HTTP_PORT: '3700',
      LOGS_DIR_PATH: '/watched_logs',
      TLS_CERT_PATH,
      TLS_KEY_PATH,
      SAVE_SELF_REPORTS_TO_FILE: 'true',
      SERVER_LOGS_DIR_PATH: '/server_logs',
      SELF_REPORTS_RETENTION_DAYS: '30',
      LOGS_NOTIFIER_SCHEDULE_REGEX: '*/30 * * * *',
      LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES: 'WARNING,ERROR',
      TELEGRAM_CHAT_ID: '123456789',
      TELEGRAM_BOT_TOKEN: '123456:ABC-DEF',
      LOGS_NOTIFIER_TIMEZONE: 'Europe/Paris'
    })

    expect(config).toStrictEqual({
      server: {
        serverName: 'Docker Prod',
        serverUrl: 'https://allowed-domain.com:3700',
        apiUrl: 'https://allowed-domain.com:3700/api',
        appUrl: 'https://allowed-domain.com:3700/app',
        apiRoutePrefix: '/api',
        appRoutePrefix: '/app',
        host: '0.0.0.0',
        port: 3700,
        allowedDomain: 'allowed-domain.com',
        tls: { cert: 'certificate content', key: 'private key content' },
        frontendDistDirPath: path.join(REPOSITORY_ROOT_PATH, 'echo_frontend', 'dist')
      },
      auth: {
        cookieName: 'allowed-domain.com_access_token',
        cookieSerializeOptions: {
          domain: 'allowed-domain.com',
          path: '/',
          secure: true,
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 86400
        },
        usersDbFilePath: path.join(DATA_DIR_PATH, 'users.db')
      },
      logs: {
        logsDirsPaths: ['/watched_logs', '/server_logs'],
        logFileExtension: '.jsonl',
        logFilesDirName: 'log',
        logsNotifier: {
          schedule: '*/30 * * * *',
          watchedLogsCategories: ['WARNING', 'ERROR'],
          notifierTimezone: 'Europe/Paris',
          serverName: 'Docker Prod',
          lastLogsCheckFilePath: path.join(DATA_DIR_PATH, 'last_logs_check.json')
        }
      },
      selfReports: {
        retentionDays: 30,
        selfReportsGroupName: 'Docker Prod',
        selfReportsDirPath: '/server_logs/self_reports/Docker Prod/log',
        parseLogFileSelfReportFileName: 'parseLogFile.jsonl',
        logsNotifierSelfReportFileName: 'logsNotifier.jsonl',
        sessionFilePath: path.join(DATA_DIR_PATH, 'self_reports_session.json')
      },
      notification: {
        telegramChatId: '123456789',
        telegramBotToken: '123456:ABC-DEF',
        telegramBaseUrl: 'https://api.telegram.org',
        telegramMessageSizeLimit: 4096
      }
    })
  })

  it('should leave the self reports out when they are disabled, whatever their other variables', async () => {
    const config = await loadBackConfig(filesService, {
      ...REQUIRED_ENV,
      SAVE_SELF_REPORTS_TO_FILE: 'false',
      SELF_REPORTS_RETENTION_DAYS: '0'
    })

    expect(config.selfReports).toBeUndefined()
    expect(config.logs.logsDirsPaths).toEqual(['/some/path'])
  })

  it('should leave the logs notifier out when there is no notification config', async () => {
    const config = await loadBackConfig(filesService, {
      ...REQUIRED_ENV,
      LOGS_NOTIFIER_SCHEDULE_REGEX: '*/30 * * * *',
      LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES: 'WARNING,ERROR',
      LOGS_NOTIFIER_TIMEZONE: 'Mars/Olympus'
    })

    expect(config.notification).toBeUndefined()
    expect(config.logs.logsNotifier).toBeUndefined()
  })
})

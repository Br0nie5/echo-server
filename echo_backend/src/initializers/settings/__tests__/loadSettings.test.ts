import path from 'path'
import { fileURLToPath } from 'url'

import dotenv, { type DotenvConfigOptions } from 'dotenv'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { getMockFilesService } from '../../../test/mocks/mockFilesService.js'
import { loadSettings } from '../loadSettings.js'

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

/** The variables of the self reports and of the notifications, each one enabled. */
const ENABLED_PARTS_ENV: NodeJS.ProcessEnv = {
  INCLUDE_SELF_REPORTS_IN_LOGS: 'true',
  SELF_REPORTS_RETENTION_DAYS: '10',
  SELF_REPORTS_DIR_PATH: '/self_reports',
  TELEGRAM_CHAT_ID: '123456789',
  TELEGRAM_BOT_TOKEN: '123456:ABC-DEF',
  LOGS_NOTIFIER_SCHEDULE: '*/30 * * * *',
  LOGS_NOTIFIER_WATCHED_LOGS_LEVELS: 'ERROR,WARNING',
  LOGS_NOTIFIER_TIMEZONE: 'UTC'
}

const REQUIRED_ENV: NodeJS.ProcessEnv = {
  SERVER_NAME: 'Echo',
  HAS_AUTHENTICATION: 'false',
  HAS_DOCUMENTATION_ROUTE: 'false',
  INCLUDE_SELF_REPORTS_IN_LOGS: 'false',
  HTTP_PORT: '4000',
  LOGS_DIR_PATH: '/some/path'
}

/**
 * Makes `dotenv` load `variables` when it is asked for the env file found at `envFilePath`, and
 * nothing for any other file.
 */
const stubEnvFile = (envFilePath: string, variables: NodeJS.ProcessEnv): void => {
  vi.mocked(dotenv.config).mockImplementation((options?: DotenvConfigOptions) => {
    if (options?.path === envFilePath && options.processEnv && options.override === false) {
      Object.assign(options.processEnv, { ...variables, ...options.processEnv })
    }
    return {}
  })
}

describe('loadSettings', () => {
  beforeEach(() => {
    vi.mocked(dotenv.config).mockReset()
    filesService.getFileContent.mockImplementation(async (filePath) => TLS_FILES_CONTENTS[filePath])
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('environment', () => {
    it('Should load .env.development when NODE_ENV is not production', async () => {
      stubEnvFile('.env.development', { ...REQUIRED_ENV, SERVER_NAME: 'Development Echo' })

      const settings = await loadSettings(filesService, { NODE_ENV: 'test' })

      expect(settings.server.serverName).toBe('Development Echo')
    })

    it('Should load .env.production when NODE_ENV is production', async () => {
      stubEnvFile('.env.production', { ...REQUIRED_ENV, SERVER_NAME: 'Production Echo' })

      const settings = await loadSettings(filesService, { NODE_ENV: 'production' })

      expect(settings.server.serverName).toBe('Production Echo')
    })

    it('Should keep the variables already set over the ones of the env file', async () => {
      stubEnvFile('.env.development', { ...REQUIRED_ENV, SERVER_NAME: 'Development Echo' })

      const settings = await loadSettings(filesService, { SERVER_NAME: 'Already Set Echo' })

      expect(settings.server.serverName).toBe('Already Set Echo')
    })

    it('Should read the environment of the process by default', async () => {
      Object.entries(REQUIRED_ENV).forEach(([key, value]) => vi.stubEnv(key, value))
      vi.stubEnv('SERVER_NAME', 'Process Echo')

      const settings = await loadSettings(filesService)

      expect(settings.server.serverName).toBe('Process Echo')
    })
  })

  it.each([
    { variable: 'SERVER_NAME', value: '' },
    { variable: 'BASE_PATH', value: '/api' },
    { variable: 'TRUSTED_PROXIES', value: 'not-an-address' },
    { variable: 'HAS_AUTHENTICATION', value: 'maybe' },
    { variable: 'HAS_DOCUMENTATION_ROUTE', value: '' },
    { variable: 'HAS_DOCUMENTATION_ROUTE', value: 'maybe' },
    { variable: 'HTTP_PORT', value: 'not-a-number' },
    { variable: 'LOGS_DIR_PATH', value: '' },
    { variable: 'INCLUDE_SELF_REPORTS_IN_LOGS', value: '' },
    { variable: 'INCLUDE_SELF_REPORTS_IN_LOGS', value: 'maybe' },
    { variable: 'SELF_REPORTS_DIR_PATH', value: '' },
    { variable: 'SELF_REPORTS_RETENTION_DAYS', value: '' },
    { variable: 'SELF_REPORTS_RETENTION_DAYS', value: '0' },
    { variable: 'LOGS_NOTIFIER_SCHEDULE', value: '' },
    { variable: 'LOGS_NOTIFIER_SCHEDULE', value: 'not-a-cron-expression' },
    { variable: 'LOGS_NOTIFIER_WATCHED_LOGS_LEVELS', value: '' },
    { variable: 'LOGS_NOTIFIER_WATCHED_LOGS_LEVELS', value: 'UNKNOWN' },
    { variable: 'LOGS_NOTIFIER_TIMEZONE', value: '' },
    { variable: 'LOGS_NOTIFIER_TIMEZONE', value: 'Mars/Olympus' }
  ])(
    'Should throw the error of the parser of $variable, which names it, on "$value"',
    async ({ variable, value }) => {
      await expect(
        loadSettings(filesService, {
          ...REQUIRED_ENV,
          ...ENABLED_PARTS_ENV,
          [variable]: value
        })
      ).rejects.toThrow(variable)
    }
  )

  it('Should build all the settings from the required variables alone', async () => {
    expect(await loadSettings(filesService, { ...REQUIRED_ENV })).toStrictEqual({
      server: {
        serverName: 'Echo',
        basePath: '',
        apiRoutePrefix: '/api',
        appRoutePrefix: '/app',
        documentationRoutePrefix: '/documentation',
        hasDocumentationRoute: false,
        host: '0.0.0.0',
        port: 4000,
        trustedProxies: undefined,
        tls: undefined,
        frontendDistDirPath: path.join(REPOSITORY_ROOT_PATH, 'echo_frontend', 'dist')
      },
      auth: undefined,
      logs: {
        logsDirPath: '/some/path',
        logFileExtension: '.jsonl',
        logFilesDirName: 'logs',
        logsNotifier: undefined
      },
      parseLogsSelfReports: undefined,
      notificationsSelfReports: undefined,
      notification: undefined
    })
  })

  it('Should build all the settings from every possible variables', async () => {
    const settings = await loadSettings(filesService, {
      NODE_ENV: 'production',
      SERVER_NAME: 'Shop Prod',
      BASE_PATH: '/tools/echo',
      TRUSTED_PROXIES: '10.0.0.1; uniquelocal',
      HAS_AUTHENTICATION: 'true',
      HAS_DOCUMENTATION_ROUTE: 'true',
      HTTP_PORT: '3700',
      LOGS_DIR_PATH: '/watched_logs',
      TLS_CERT_PATH,
      TLS_KEY_PATH,
      INCLUDE_SELF_REPORTS_IN_LOGS: 'true',
      SELF_REPORTS_RETENTION_DAYS: '30',
      SELF_REPORTS_DIR_PATH: '/self_reports',
      LOGS_NOTIFIER_SCHEDULE: '*/30 * * * *',
      LOGS_NOTIFIER_WATCHED_LOGS_LEVELS: 'WARNING,ERROR',
      TELEGRAM_CHAT_ID: '123456789',
      TELEGRAM_BOT_TOKEN: '123456:ABC-DEF',
      LOGS_NOTIFIER_TIMEZONE: 'Europe/Paris'
    })

    expect(settings).toStrictEqual({
      server: {
        serverName: 'Shop Prod',
        basePath: '/tools/echo',
        apiRoutePrefix: '/api',
        appRoutePrefix: '/app',
        documentationRoutePrefix: '/documentation',
        hasDocumentationRoute: true,
        host: '0.0.0.0',
        port: 3700,
        trustedProxies: ['10.0.0.1', 'uniquelocal'],
        tls: { cert: 'certificate content', key: 'private key content' },
        frontendDistDirPath: path.join(REPOSITORY_ROOT_PATH, 'echo_frontend', 'dist')
      },
      auth: {
        config: {
          sessionDurationSeconds: 86400,
          credentialsAttemptsLimit: { maxAttempts: 5, timeWindowMilliseconds: 60 * 1000 },
          cookieName: 'Shop_Prod_echo_access_token',
          cookieSerializeOptions: {
            path: '/tools/echo',
            secure: 'auto',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 86400
          }
        },
        usersDbFilePath: path.join(DATA_DIR_PATH, 'users.db')
      },
      logs: {
        logsDirPath: '/watched_logs',
        logFileExtension: '.jsonl',
        logFilesDirName: 'logs',
        logsNotifier: {
          config: {
            schedule: '*/30 * * * *',
            watchedLogsLevels: ['WARNING', 'ERROR'],
            timezone: 'Europe/Paris',
            serverName: 'Shop Prod'
          },
          lastLogsCheckFilePath: path.join(DATA_DIR_PATH, 'last_logs_check.json')
        }
      },
      parseLogsSelfReports: {
        retentionDays: 30,
        dirPath: '/self_reports/Shop Prod',
        fileName: 'parseLogs.jsonl',
        sessionFilePath: path.join(DATA_DIR_PATH, 'parse_logs_self_reports_session.json'),
        isEachProblemStoredOnce: true
      },
      notificationsSelfReports: {
        retentionDays: 30,
        dirPath: '/self_reports/Shop Prod',
        fileName: 'notifications.jsonl',
        sessionFilePath: path.join(DATA_DIR_PATH, 'notifications_self_reports_session.json'),
        isEachProblemStoredOnce: false
      },
      notification: {
        telegramChatId: '123456789',
        telegramBotToken: '123456:ABC-DEF',
        telegramBaseUrl: 'https://api.telegram.org',
        telegramMessageSizeLimit: 4096,
        telegramRequestTimeoutMilliseconds: 10 * 1000
      }
    })
  })

  it('Should leave the self reports out when they are not included in the logs, without reading their other variables', async () => {
    const settings = await loadSettings(filesService, {
      ...REQUIRED_ENV,
      INCLUDE_SELF_REPORTS_IN_LOGS: 'false',
      SELF_REPORTS_RETENTION_DAYS: '0'
    })

    expect(settings.parseLogsSelfReports).toBeUndefined()
    expect(settings.notificationsSelfReports).toBeUndefined()
  })

  it('Should leave the logs notifier and the self reports of the notifications out when there are no notification settings', async () => {
    const settings = await loadSettings(filesService, {
      ...REQUIRED_ENV,
      INCLUDE_SELF_REPORTS_IN_LOGS: 'true',
      SELF_REPORTS_RETENTION_DAYS: '10',
      SELF_REPORTS_DIR_PATH: '/self_reports',
      LOGS_NOTIFIER_SCHEDULE: 'not-a-cron-expression',
      LOGS_NOTIFIER_TIMEZONE: 'Mars/Olympus'
    })

    expect(settings.notification).toBeUndefined()
    expect(settings.logs.logsNotifier).toBeUndefined()
    expect(settings.notificationsSelfReports).toBeUndefined()
    expect(settings.parseLogsSelfReports).toBeDefined()
  })
})

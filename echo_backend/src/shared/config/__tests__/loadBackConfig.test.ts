import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import dotenv, { type DotenvConfigOptions } from 'dotenv'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { loadBackConfig } from '../loadBackConfig.js'

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }))

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = path.join(__dirname, 'fixtures')
const TEST_CERT_PATH = path.join(FIXTURES_DIR, 'test-cert.pem')
const TEST_KEY_PATH = path.join(FIXTURES_DIR, 'test-key.pem')

const REPOSITORY_ROOT_PATH = path.join(__dirname, '../../../../..')
const DATA_DIR_PATH = path.join(REPOSITORY_ROOT_PATH, 'data')

const REQUIRED_ENV: NodeJS.ProcessEnv = {
  SERVER_NAME: 'Echo',
  SERVER_URL: 'http://localhost:5173',
  HAS_AUTHENTICATION: 'false',
  HTTP_PORT: '4000',
  LOGS_DIR_PATH: '/some/path'
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
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('environment', () => {
    it('should load .env.development when NODE_ENV is not production', () => {
      stubEnvFile('.env.development', { ...REQUIRED_ENV, SERVER_NAME: 'Development Echo' })

      const config = loadBackConfig({ NODE_ENV: 'test' })

      expect(config.server.serverName).toBe('Development Echo')
    })

    it('should load .env.production when NODE_ENV is production', () => {
      stubEnvFile('.env.production', { ...REQUIRED_ENV, SERVER_NAME: 'Production Echo' })

      const config = loadBackConfig({ NODE_ENV: 'production' })

      expect(config.server.serverName).toBe('Production Echo')
    })

    it('should keep the variables already set over the ones of the env file', () => {
      stubEnvFile('.env.development', { ...REQUIRED_ENV, SERVER_NAME: 'Development Echo' })

      const config = loadBackConfig({ SERVER_NAME: 'Already Set Echo' })

      expect(config.server.serverName).toBe('Already Set Echo')
    })

    it('should read the environment of the process by default', () => {
      Object.entries(REQUIRED_ENV).forEach(([key, value]) => vi.stubEnv(key, value))
      vi.stubEnv('SERVER_NAME', 'Process Echo')

      const config = loadBackConfig()

      expect(config.server.serverName).toBe('Process Echo')
    })
  })

  it.each([
    { variable: 'SERVER_NAME', value: '' },
    { variable: 'SERVER_URL', value: 'not-a-url' },
    { variable: 'HAS_AUTHENTICATION', value: 'maybe' },
    { variable: 'HTTP_PORT', value: 'not-a-number' },
    { variable: 'LOGS_DIR_PATH', value: '' },
    { variable: 'SELF_LOGS_ENABLED', value: 'maybe' },
    { variable: 'SELF_LOGS_RETENTION_DAYS', value: '0' }
  ])('should throw when the parser of $variable throws on "$value"', ({ variable, value }) => {
    expect(() => loadBackConfig({ ...REQUIRED_ENV, [variable]: value })).toThrow()
  })

  it('should build the whole config, with its defaults, from the required variables alone', () => {
    expect(loadBackConfig({ ...REQUIRED_ENV })).toStrictEqual({
      server: {
        serverName: 'Echo',
        serverUrl: 'http://localhost:5173',
        apiUrl: 'http://localhost:5173/api',
        appUrl: 'http://localhost:5173/app',
        host: '0.0.0.0',
        port: 4000,
        allowedDomain: 'localhost',
        tls: undefined,
        frontendDistDirPath: path.join(REPOSITORY_ROOT_PATH, 'echo_frontend', 'dist')
      },
      auth: {
        hasAuthentication: false,
        cookieName: 'localhost_access_token',
        cookieSerializeOptions: {
          domain: undefined,
          path: '/',
          secure: false,
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 86400
        },
        usersDbFilePath: path.join(DATA_DIR_PATH, 'users.db')
      },
      logs: {
        logsDirPath: '/some/path',
        logFileExtension: '.jsonl',
        selfLogs: {
          isEnabled: false,
          retentionDays: 10,
          selfLogsDirPath: '/some/path/server/Echo/log',
          parseLogFileSelfLogFileName: 'parseLogFile.jsonl',
          sessionFilePath: path.join(DATA_DIR_PATH, 'self_logs_session.json')
        },
        cron: undefined
      }
    })
  })

  it('should build the whole config from every possible variables', () => {
    const config = loadBackConfig({
      NODE_ENV: 'production',
      SERVER_NAME: 'Docker Prod',
      SERVER_URL: 'https://allowed-domain.com:3700',
      HAS_AUTHENTICATION: 'true',
      HTTP_PORT: '3700',
      LOGS_DIR_PATH: '/watched_logs',
      TLS_CERT_PATH: TEST_CERT_PATH,
      TLS_KEY_PATH: TEST_KEY_PATH,
      SELF_LOGS_ENABLED: 'true',
      SELF_LOGS_RETENTION_DAYS: '30',
      LOGS_CRON_SCHEDULE_REGEX: '*/30 * * * *',
      LOGS_CRON_WATCHED_LOGS_CATEGORIES: 'WARNING,ERROR',
      LOGS_CRON_TELEGRAM_CHAT_ID: '123456789',
      LOGS_CRON_TELEGRAM_BASE_URL: 'https://api.telegram.org/bot123456789',
      LOGS_CRON_TELEGRAM_TIMEZONE: 'Europe/Paris'
    })

    expect(config).toStrictEqual({
      server: {
        serverName: 'Docker Prod',
        serverUrl: 'https://allowed-domain.com:3700',
        apiUrl: 'https://allowed-domain.com:3700/api',
        appUrl: 'https://allowed-domain.com:3700/app',
        host: '0.0.0.0',
        port: 3700,
        allowedDomain: 'allowed-domain.com',
        tls: {
          cert: readFileSync(TEST_CERT_PATH),
          key: readFileSync(TEST_KEY_PATH)
        },
        frontendDistDirPath: path.join(REPOSITORY_ROOT_PATH, 'echo_frontend', 'dist')
      },
      auth: {
        hasAuthentication: true,
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
        logsDirPath: '/watched_logs',
        logFileExtension: '.jsonl',
        selfLogs: {
          isEnabled: true,
          retentionDays: 30,
          selfLogsDirPath: '/watched_logs/server/Docker Prod/log',
          parseLogFileSelfLogFileName: 'parseLogFile.jsonl',
          sessionFilePath: path.join(DATA_DIR_PATH, 'self_logs_session.json')
        },
        cron: {
          schedule: '*/30 * * * *',
          watchedLogsCategories: ['WARNING', 'ERROR'],
          telegramChatId: '123456789',
          telegramBaseUrl: 'https://api.telegram.org/bot123456789',
          telegramTimezone: 'Europe/Paris',
          serverName: 'Docker Prod',
          lastLogsCheckFilePath: path.join(DATA_DIR_PATH, 'last_logs_check.json')
        }
      }
    })
  })
})

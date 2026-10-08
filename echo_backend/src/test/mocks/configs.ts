import type {
  AuthConfig,
  CronConfig,
  LogsConfig,
  SelfLogsConfig
} from '../../shared/config/backConfig.js'

/** An `AuthConfig` for the tests, with `overrides` on top of its defaults. */
export const getMockAuthConfig = (overrides: Partial<AuthConfig> = {}): AuthConfig => ({
  hasAuthentication: true,
  cookieName: 'test-cookie',
  cookieSerializeOptions: { httpOnly: true, path: '/' },
  usersDbFilePath: '/fake/data/users.db',
  ...overrides
})

/** A `SelfLogsConfig` for the tests, with `overrides` on top of its defaults. */
export const getMockSelfLogsConfig = (overrides: Partial<SelfLogsConfig> = {}): SelfLogsConfig => ({
  isEnabled: true,
  retentionDays: 10,
  selfLogsDirPath: '/logs/server/Echo/log',
  parseLogFileSelfLogFileName: 'parseLogFile.jsonl',
  sessionFilePath: '/fake/data/self_logs_session.json',
  ...overrides
})

/** A `CronConfig` for the tests, with `overrides` on top of its defaults. */
export const getMockCronConfig = (overrides: Partial<CronConfig> = {}): CronConfig => ({
  schedule: '*/30 * * * *',
  watchedLogsCategories: ['ERROR', 'WARNING'],
  telegramChatId: 'chat-123',
  telegramBaseUrl: 'https://api.telegram.org/bot-fake',
  telegramTimezone: 'UTC',
  serverName: 'test-device',
  lastLogsCheckFilePath: '/fake/data/last_logs_check.json',
  ...overrides
})

/** A `LogsConfig` without cron for the tests, with `overrides` on top of its defaults. */
export const getMockLogsConfig = (overrides: Partial<LogsConfig> = {}): LogsConfig => ({
  logsDirPath: '/logs',
  logFileExtension: '.jsonl',
  selfLogs: getMockSelfLogsConfig(),
  ...overrides
})

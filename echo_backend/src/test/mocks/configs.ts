import type {
  AuthConfig,
  LogsNotifierConfig,
  NotificationConfig,
  LogsConfig,
  SelfReportsConfig
} from '../../shared/config/backConfig.js'

/** An `AuthConfig` for the tests, with `overrides` on top of its defaults. */
export const getMockAuthConfig = (overrides: Partial<AuthConfig> = {}): AuthConfig => ({
  hasAuthentication: true,
  cookieName: 'test-cookie',
  cookieSerializeOptions: { httpOnly: true, path: '/' },
  usersDbFilePath: '/fake/data/users.db',
  ...overrides
})

/** A `SelfReportsConfig` for the tests, with `overrides` on top of its defaults. */
export const getMockSelfReportsConfig = (
  overrides: Partial<SelfReportsConfig> = {}
): SelfReportsConfig => ({
  isEnabled: true,
  retentionDays: 10,
  selfReportsDirPath: '/logs/server/Echo/log',
  parseLogFileSelfReportFileName: 'parseLogFile.jsonl',
  logsNotifierSelfReportFileName: 'logsNotifier.jsonl',
  sessionFilePath: '/fake/data/self_reports_session.json',
  ...overrides
})

/** A `LogsNotifierConfig` for the tests, with `overrides` on top of its defaults. */
export const getMockLogsNotifierConfig = (
  overrides: Partial<LogsNotifierConfig> = {}
): LogsNotifierConfig => ({
  schedule: '*/30 * * * *',
  watchedLogsCategories: ['ERROR', 'WARNING'],
  notifierTimezone: 'UTC',
  serverName: 'test-device',
  lastLogsCheckFilePath: '/fake/data/last_logs_check.json',
  ...overrides
})

/** A `NotificationConfig` for the tests, with `overrides` on top of its defaults. */
export const getMockNotificationConfig = (
  overrides: Partial<NotificationConfig> = {}
): NotificationConfig => ({
  telegramChatId: 'chat-123',
  telegramBaseUrl: 'https://api.telegram.org/bot-fake',
  telegramMessageSizeLimit: 4096,
  ...overrides
})

/** A `LogsConfig` without logs notifier for the tests, with `overrides` on top of its defaults. */
export const getMockLogsConfig = (overrides: Partial<LogsConfig> = {}): LogsConfig => ({
  logsDirPath: '/logs',
  logFileExtension: '.jsonl',
  ...overrides
})

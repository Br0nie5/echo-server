import type {
  AuthConfig,
  BackConfig,
  LogsNotifierConfig,
  NotificationConfig,
  LogsConfig,
  SelfReportsConfig,
  ServerConfig
} from '../../shared/config/backConfig.js'

/** A `ServerConfig` without TLS for the tests, with `overrides` on top of its defaults. */
export const getMockServerConfig = (overrides: Partial<ServerConfig> = {}): ServerConfig => ({
  serverName: 'test-device',
  serverUrl: 'http://localhost:5173',
  apiUrl: 'http://localhost:5173/api',
  appUrl: 'http://localhost:5173/app',
  apiRoutePrefix: '/api',
  appRoutePrefix: '/app',
  host: '127.0.0.1',
  port: 4000,
  allowedDomain: 'localhost',
  frontendDistDirPath: '/fake/echo_frontend/dist',
  ...overrides
})

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
  retentionDays: 10,
  selfReportsGroupName: 'Echo',
  selfReportsDirPath: '/server_logs/self_reports/Echo/log',
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
  logsDirsPaths: ['/logs'],
  logFileExtension: '.jsonl',
  logFilesDirName: 'log',
  ...overrides
})

/**
 * A `BackConfig` for the tests, made of the default mock of each of its parts, with `overrides` on
 * top: it has self reports, and no logs notifier and no notification unless they are given.
 */
export const getMockBackConfig = (overrides: Partial<BackConfig> = {}): BackConfig => ({
  server: getMockServerConfig(),
  auth: getMockAuthConfig(),
  logs: getMockLogsConfig(),
  selfReports: getMockSelfReportsConfig(),
  ...overrides
})

import type {
  AuthSettings,
  LogsNotifierSettings,
  LogsSettings,
  NotificationSettings,
  SelfReportsSettings,
  ServerSettings,
  Settings
} from '../../initializers/settings/settings.js'

import { getMockAuthConfig, getMockLogsNotifierConfig } from './mockConfigs.js'

/**
 * `ServerSettings` without TLS, trusting any proxy and serving the documentation, for the tests,
 * with `overrides` on top of their defaults.
 */
export const getMockServerSettings = (overrides: Partial<ServerSettings> = {}): ServerSettings => ({
  serverName: 'test-device',
  basePath: '',
  apiRoutePrefix: '/api',
  appRoutePrefix: '/app',
  documentationRoutePrefix: '/documentation',
  hasDocumentationRoute: true,
  host: '127.0.0.1',
  port: 4000,
  frontendDistDirPath: '/fake/echo_frontend/dist',
  ...overrides
})

/**
 * `AuthSettings` for the tests, holding the default mock of the `AuthConfig`, with `overrides` on
 * top of their defaults.
 */
export const getMockAuthSettings = (overrides: Partial<AuthSettings> = {}): AuthSettings => ({
  config: getMockAuthConfig(),
  usersDbFilePath: '/fake/data/users.db',
  ...overrides
})

/**
 * `SelfReportsSettings` for the tests, those of the lines of the log files that hold no log, with
 * `overrides` on top of their defaults.
 */
export const getMockSelfReportsSettings = (
  overrides: Partial<SelfReportsSettings> = {}
): SelfReportsSettings => ({
  retentionDays: 10,
  rootDirPath: '/srv/self_reports',
  dirPath: '/srv/self_reports/Echo',
  fileName: 'parseLogs.jsonl',
  sessionFilePath: '/fake/data/parse_logs_self_reports_session.json',
  isEachProblemStoredOnce: true,
  ...overrides
})

/**
 * `SelfReportsSettings` for the tests, those of the notifications that could not be sent, with
 * `overrides` on top of their defaults.
 */
export const getMockNotificationsSelfReportsSettings = (
  overrides: Partial<SelfReportsSettings> = {}
): SelfReportsSettings =>
  getMockSelfReportsSettings({
    fileName: 'notifications.jsonl',
    sessionFilePath: '/fake/data/notifications_self_reports_session.json',
    isEachProblemStoredOnce: false,
    ...overrides
  })

/**
 * `LogsNotifierSettings` for the tests, holding the default mock of the `LogsNotifierConfig`, with
 * `overrides` on top of their defaults.
 */
export const getMockLogsNotifierSettings = (
  overrides: Partial<LogsNotifierSettings> = {}
): LogsNotifierSettings => ({
  config: getMockLogsNotifierConfig(),
  lastLogsCheckFilePath: '/fake/data/last_logs_check.json',
  ...overrides
})

/** `NotificationSettings` for the tests, with `overrides` on top of their defaults. */
export const getMockNotificationSettings = (
  overrides: Partial<NotificationSettings> = {}
): NotificationSettings => ({
  telegramChatId: 'chat-123',
  telegramBotToken: 'fake-bot-token',
  telegramBaseUrl: 'https://api.telegram.org',
  telegramMessageSizeLimit: 4096,
  telegramRequestTimeoutMilliseconds: 10 * 1000,
  ...overrides
})

/**
 * `LogsSettings` without logs notifier, for the tests, with `overrides` on top of their defaults.
 */
export const getMockLogsSettings = (overrides: Partial<LogsSettings> = {}): LogsSettings => ({
  logsDirPath: '/logs',
  logFileExtension: '.jsonl',
  logFilesDirName: 'logs',
  ...overrides
})

/**
 * `Settings` for the tests, made of the default mock of each of their parts, with `overrides` on
 * top: they have authentication and self reports, and no logs notifier and no notification unless
 * they are given.
 */
export const getMockSettings = (overrides: Partial<Settings> = {}): Settings => ({
  server: getMockServerSettings(),
  auth: getMockAuthSettings(),
  logs: getMockLogsSettings(),
  parseLogsSelfReports: getMockSelfReportsSettings(),
  notificationsSelfReports: getMockNotificationsSelfReportsSettings(),
  ...overrides
})

import type { AuthConfig } from '../../shared/config/authConfig.js'
import type { LogsNotifierConfig } from '../../shared/config/logsNotifierConfig.js'

/** An `AuthConfig` for the tests, with `overrides` on top of its defaults. */
export const getMockAuthConfig = (overrides: Partial<AuthConfig> = {}): AuthConfig => ({
  sessionDurationSeconds: 24 * 60 * 60,
  credentialsAttemptsLimit: { maxAttempts: 5, timeWindowMilliseconds: 60 * 1000 },
  cookieName: 'test-cookie',
  cookieSerializeOptions: { httpOnly: true, path: '/' },
  ...overrides
})

/** A `LogsNotifierConfig` for the tests, with `overrides` on top of its defaults. */
export const getMockLogsNotifierConfig = (
  overrides: Partial<LogsNotifierConfig> = {}
): LogsNotifierConfig => ({
  schedule: '*/30 * * * *',
  watchedLogsLevels: ['ERROR', 'WARNING'],
  timezone: 'UTC',
  serverName: 'test-device',
  ...overrides
})

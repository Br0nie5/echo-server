import type { FrontConfig } from '../../shared/config/frontConfig'
import type { AppUrls } from '../../shared/config/utils/parseAppUrls'

/**
 * The content of `env.<mode>.json` the tests run the app with, served by `renderRealRouterApp` and
 * `renderFakeRouterApp`.
 */
export const mockRawConfig = {
  SERVER_NAME: 'Test',
  HAS_AUTHENTICATION: true,
  LOGS_INITIAL_DATE_DAYS_AGO: 2,
  LOGS_MINIMAL_DATE_DAYS_AGO: 14
}

/** Where the app and the API are reached in the tests, read from the `<base>` of their page. */
export const mockAppUrls: AppUrls = {
  appUrl: 'http://localhost:3000/app',
  apiUrl: 'http://localhost:3000/api'
}

/**
 * Builds the config the app builds from `mockRawConfig` and `mockAppUrls` when it loads at `now`.
 *
 * ```ts
 * const config = buildMockConfig(new Date(2026, 3, 28, 10, 0, 0))
 * config.logsMinimalDate // new Date(2026, 3, 14)
 * ```
 */
export const buildMockConfig = (now: Date): FrontConfig => {
  const getFirstInstantOfDayBefore = (daysAgo: number): Date => {
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    date.setHours(0, 0, 0, 0)
    return date
  }

  return {
    serverName: mockRawConfig.SERVER_NAME,
    hasAuthentication: mockRawConfig.HAS_AUTHENTICATION,
    ...mockAppUrls,
    logsInitialDate: getFirstInstantOfDayBefore(mockRawConfig.LOGS_INITIAL_DATE_DAYS_AGO),
    logsMinimalDate: getFirstInstantOfDayBefore(mockRawConfig.LOGS_MINIMAL_DATE_DAYS_AGO),
    logsMaximalDate: getFirstInstantOfDayBefore(0)
  }
}

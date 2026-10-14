import type { FrontConfig } from '../../shared/config/frontConfig'

/** The content of `env.<mode>.json` the tests run the app with, served by `renderRealRouterApp` and `renderFakeRouterApp`. */
export const mockRawConfig = {
  SERVER_NAME: 'Test',
  HAS_AUTHENTICATION: true,
  LOGS_INITIAL_DATE_DAYS_AGO: 2,
  LOGS_MINIMAL_DATE_DAYS_AGO: 14
}

/** The config the app builds from `mockRawConfig` and the `<base>` of the page of the tests. */
export const mockConfig: FrontConfig = {
  serverName: 'Test',
  hasAuthentication: true,
  LOGS_INITIAL_DATE_DAYS_AGO: 2,
  LOGS_MINIMAL_DATE_DAYS_AGO: 14,
  LOGS_MAXIMAL_DATE_DAYS_AGO: 0,
  API_URL: 'http://localhost:3000/api',
  APP_URL: 'http://localhost:3000/app'
}

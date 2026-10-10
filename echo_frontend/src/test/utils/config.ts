import type { FrontConfig } from '../../shared/config/frontConfig'

export const testConfig: FrontConfig = {
  SERVER_NAME: 'Test',
  API_URL: 'http://localhost:3000/api',
  APP_URL: 'http://localhost:3000/app',
  HAS_AUTHENTICATION: true,
  LOGS_INITIAL_DATE_DAYS_AGO: 2,
  LOGS_MINIMAL_DATE_DAYS_AGO: 14
}

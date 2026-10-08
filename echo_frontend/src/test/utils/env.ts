import type { Config } from '@echo/utilities'

export const testEnv: Config = {
  SERVER_NAME: 'Test',
  SERVER_URL: 'http://localhost:3000',
  API_URL: 'http://localhost:3000/api',
  APP_URL: 'http://localhost:3000/app',
  HAS_AUTHENTICATION: true
}

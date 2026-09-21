import type { EchoEnv } from '@echo/utilities'

export const testEnv: EchoEnv = {
  SERVER_NAME: 'Test',
  SERVER_URL: 'http://localhost:3000',
  API_URL: 'http://localhost:3000/api',
  APP_URL: 'http://localhost:3000/app',
  HAS_AUTHENTICATION: true
}

/** Environment common to the backend and the frontend. `API_URL` and `APP_URL` are derived from `SERVER_URL`. */
export type EchoEnv = {
  SERVER_NAME: string
  SERVER_URL: string
  API_URL: string
  APP_URL: string
  HAS_AUTHENTICATION: boolean
}

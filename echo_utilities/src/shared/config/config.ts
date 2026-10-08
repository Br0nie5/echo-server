/**
 * The configuration common to the backend and the frontend.
 *
 * It is built by `parseConfig`, from the environment of each one. `API_URL` and `APP_URL` are not
 * variables of their own: they are derived from `SERVER_URL`, the backend serving both the API and
 * the frontend under one origin.
 */
export type Config = {
  SERVER_NAME: string
  SERVER_URL: string
  API_URL: string
  APP_URL: string
  HAS_AUTHENTICATION: boolean
}

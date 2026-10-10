/**
 * The configuration common to the backend and the frontend.
 *
 * It is built by `parseConfig`, from the environment of each one. `API_URL` and `APP_URL` are not
 * variables of their own: they are derived from `SERVER_URL`, the backend serving both the API and
 * the frontend under it.
 */
export type Config = {
  /** Name of the server Echo runs on, shown to the user and naming its self reports. */
  SERVER_NAME: string
  /** The URL the backend serves the API and the frontend under: an origin, possibly followed by a path when Echo is behind a reverse proxy. */
  SERVER_URL: string
  /** Where the API is served: `SERVER_URL` followed by `apiRoutePrefix`. */
  API_URL: string
  /** Where the frontend is served: `SERVER_URL` followed by `appRoutePrefix`. */
  APP_URL: string
  /** Whether a user must log in to read the logs. */
  HAS_AUTHENTICATION: boolean
}

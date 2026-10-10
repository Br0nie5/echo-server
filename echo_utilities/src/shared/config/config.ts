/**
 * The configuration common to the backend and the frontend.
 *
 * It is built by `parseConfig`, from the environment of each one. Where Echo is reached is not part
 * of it: the backend reads it from `SERVER_URL`, and the frontend from the page it was loaded from.
 */
export type Config = {
  /** Name of the server Echo runs on, shown to the user and naming its self reports. */
  SERVER_NAME: string
  /** Whether a user must log in to read the logs. */
  HAS_AUTHENTICATION: boolean
}

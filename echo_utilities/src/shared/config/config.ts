/** The configuration every part of Echo shares, which `parseConfig` builds. */
export type Config = {
  /** Name of the server Echo runs on, the one shown to the user. */
  SERVER_NAME: string
  /** Whether a user must log in to read the logs. */
  HAS_AUTHENTICATION: boolean
}

/** The configuration every part of Echo shares, which `parseConfig` builds. */
export interface Config {
  /** Name of the server Echo runs on, the one shown to the user (`SERVER_NAME`). */
  serverName: string
  /** Whether a user must log in to read the logs (`HAS_AUTHENTICATION`). */
  hasAuthentication: boolean
}

/**
 * Builds the name of the group the self reports of the server named `serverName` are shown under.
 *
 * It is `serverName`, in which every character other than a letter, a digit, `-`, `_` or a space
 * is replaced with `_`: the group is also the name of a directory (see `createSelfReportsDirPath`).
 */
export const createSelfReportsGroupName = (serverName: string): string =>
  // SERVER_NAME is a free-text display value, not a path-safe identifier: `/` and `..` would
  // otherwise move the self reports out of their directory.
  serverName.replace(/[^a-zA-Z0-9-_ ]/g, '_')

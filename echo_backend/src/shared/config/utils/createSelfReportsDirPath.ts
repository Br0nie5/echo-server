import path from 'path'

/**
 * Builds the path of the directory of the self-report files of the server named `serverName`:
 * `<logsDirPath>/server/<serverName>/log`.
 *
 * In that path, every character of `serverName` other than a letter, a digit, `-`, `_` or a space
 * is replaced with `_`.
 */
export const createSelfReportsDirPath = (logsDirPath: string, serverName: string): string => {
  // SERVER_NAME is a free-text display value, not a path-safe identifier: `/` and `..` would
  // otherwise move the self reports out of their directory.
  const serverDirectoryName = serverName.replace(/[^a-zA-Z0-9-_ ]/g, '_')

  return path.join(logsDirPath, 'server', serverDirectoryName, 'log')
}

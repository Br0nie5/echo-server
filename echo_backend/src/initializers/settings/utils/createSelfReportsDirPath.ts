import path from 'path'

/**
 * Builds the path of the directory holding the self-report files of the server named `serverName`:
 * `<selfReportsRootDirPath>/<serverName>`.
 *
 * In `serverName`, every character other than a letter, a digit, `-`, `_` or a space is replaced
 * with `_`, as it names a directory.
 */
export const createSelfReportsDirPath = (
  selfReportsRootDirPath: string,
  serverName: string
): string =>
  path.join(
    selfReportsRootDirPath,
    // SERVER_NAME is a free-text display value, not a path-safe identifier: `/` and `..` would
    // otherwise move the self reports out of their directory.
    serverName.replace(/[^a-zA-Z0-9-_ ]/g, '_')
  )

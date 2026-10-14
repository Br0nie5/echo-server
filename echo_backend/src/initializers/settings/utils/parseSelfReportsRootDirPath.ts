import path from 'path'

import { createSelfReportsDirPath } from './createSelfReportsDirPath.js'

/**
 * Parses `SELF_REPORTS_DIR_PATH`, the directory holding the self-report files of every server, for
 * the server named `serverName`, whose logs are read from `logsDirPath`.
 *
 * Gives `raw` as it is. Throws when the directory of the self-report files of the server (see
 * `createSelfReportsDirPath`) is `logsDirPath` or below it: the self-report files, which have the
 * extension of the log files, would be read as log files, and each of their lines, which holds no
 * log, would be reported again, at every read of the logs.
 *
 * ```ts
 * parseSelfReportsRootDirPath('/self_reports', { serverName: 'Echo', logsDirPath: '/watched_logs' })
 * // '/self_reports'
 * parseSelfReportsRootDirPath('/watched_logs/self_reports', {
 *   serverName: 'Echo',
 *   logsDirPath: '/watched_logs'
 * }) // throws
 * ```
 */
export const parseSelfReportsRootDirPath = (
  raw: string,
  { serverName, logsDirPath }: { serverName: string; logsDirPath: string }
): string => {
  const pathFromLogsDir = path.relative(logsDirPath, createSelfReportsDirPath(raw, serverName))
  const isInLogsDir = pathFromLogsDir !== '..' && !pathFromLogsDir.startsWith(`..${path.sep}`)

  if (isInLogsDir) {
    throw new Error(
      `Invalid self-reports directory: ${raw}, the self reports of ${serverName} would be ` +
        `stored in the logs directory, ${logsDirPath}, and read as logs`
    )
  }

  return raw
}

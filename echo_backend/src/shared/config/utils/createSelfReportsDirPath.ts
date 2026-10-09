import path from 'path'

/**
 * Builds the path of the directory of the self-report files of the group `selfReportsGroupName`:
 * `<serverLogsRootDirPath>/self_reports/<selfReportsGroupName>/<logFilesDirName>`.
 *
 * The logs being read from `serverLogsRootDirPath` too, the self reports stored there are read
 * back as logs of that group: `logFilesDirName`, the name of the directory log files are put in,
 * is left out of it. `selfReportsGroupName` has to be safe for a path, which the one
 * `createSelfReportsGroupName` gives is.
 */
export const createSelfReportsDirPath = (
  serverLogsRootDirPath: string,
  selfReportsGroupName: string,
  logFilesDirName: string
): string => path.join(serverLogsRootDirPath, 'self_reports', selfReportsGroupName, logFilesDirName)

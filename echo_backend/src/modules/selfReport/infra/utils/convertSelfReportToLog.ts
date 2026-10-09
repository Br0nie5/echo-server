import { LogCategory, type Log } from '@echo/utilities'

import type { SelfReport } from '../../domain/selfReport.js'

/** The category a self report of each level is stored with as a log. */
const LOG_CATEGORY_BY_SELF_REPORT_LEVEL: Record<SelfReport['level'], LogCategory> = {
  warning: LogCategory.WARNING,
  error: LogCategory.ERROR
}

/** The `callLine` of a self report that points to no line: a log always has one. */
const CALL_LINE_WITHOUT_REPORTED_LINE = 0

/**
 * What a log says that a self report does not carry: everything of a `Log` that
 * {@link convertSelfReportToLog} does not work out from the self report itself.
 */
export type SelfReportLogContext = Omit<
  Log,
  'id' | 'date' | 'category' | 'message' | 'callFile' | 'callLine'
>

/**
 * Converts a self report to the log it is stored as.
 *
 * The level becomes the category, and `reportedFile` and `reportedLine` the `callFile` and
 * `callLine`, which is `0` for a self report without `reportedLine`. `context` gives the rest: the
 * job the self report was reported during, and where it is stored. The `id` is made of everything
 * else the log holds, so two self reports only share it when they are the same one.
 */
export const convertSelfReportToLog = (
  { date, message, level, reportedFile, reportedLine }: SelfReport,
  context: SelfReportLogContext
): Log => {
  const log: Omit<Log, 'id'> = {
    ...context,
    date: date.toISOString(),
    category: LOG_CATEGORY_BY_SELF_REPORT_LEVEL[level],
    message,
    callFile: reportedFile,
    callLine: reportedLine ?? CALL_LINE_WITHOUT_REPORTED_LINE
  }

  return {
    ...log,
    id: [
      log.location,
      log.groupName,
      log.locationName,
      log.jobId,
      log.date,
      log.category,
      log.callFile,
      log.callLine,
      log.message
    ].join(' ')
  }
}

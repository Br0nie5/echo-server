import type { Log } from '@echo/utilities'

import { groupLogs, sortGroupsByNewestFirstLog } from './groupLogs'
import type { LogsByDay } from './types'

/** The day of the log, as noon local time so timezone shifts do not change the day. */
const getLogDay = (log: Log): Date => {
  const logDay = new Date(log.date)
  logDay.setHours(12, 0, 0, 0)
  return logDay
}

/** Groups the logs by local day, newest first. */
export const groupLogsByDay = (logs: Log[]): LogsByDay[] =>
  sortGroupsByNewestFirstLog(
    groupLogs<LogsByDay>(
      logs,
      (log) => getLogDay(log).toISOString(),
      (id, log) => ({ id, date: getLogDay(log), logs: [log] })
    )
  )

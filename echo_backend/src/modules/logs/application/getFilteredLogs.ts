import {
  filterLogByLevels,
  filterLogBySearch,
  type Log,
  type LogLevel,
  type LogSearchFilter
} from '@echo/utilities'

import type { SelfReportRepository } from '../../selfReport/domain/selfReport.repository.js'
import type { LogsRepository } from '../domain/logs.repository.js'

/** Filters of a logs lookup. An empty `levels` or `searchFilters` matches everything. */
interface LogsFilters {
  fromDate: Date
  /** When given, only the logs logged before it match: it is left out of the period, `fromDate` is not. */
  toDate?: Date
  levels: LogLevel[]
  searchFilters: LogSearchFilter[]
}

/**
 * Returns the logs of `logsRepository` matching `filters`, from the newest to the oldest.
 *
 * A log matches when it was logged at `fromDate` or later, before `toDate` when it is given, is in
 * one of the `levels` and passes every one of the `searchFilters`. Two lookups where the
 * `toDate` of the first is the `fromDate` of the second therefore never give the same log. The
 * filtering is done in memory, with `filterLogByLevels` and `filterLogBySearch`.
 *
 * The self reports `logsRepository` gives along with its logs, about the stored entries that hold
 * no valid log, are saved to `selfReportRepository`, all in a single save.
 *
 * ```ts
 * const logs = await getFilteredLogs(logsRepository, selfReportRepository, {
 *   fromDate,
 *   levels: ['ERROR'],
 *   searchFilters: []
 * })
 * ```
 */
export const getFilteredLogs = async (
  logsRepository: LogsRepository,
  selfReportRepository: SelfReportRepository,
  { fromDate, toDate, levels, searchFilters }: LogsFilters
): Promise<Log[]> => {
  const { logs, selfReports } = await logsRepository.getAllLogs()

  await selfReportRepository.saveSelfReports(selfReports)

  return logs
    .filter((log) => new Date(log.date).getTime() >= fromDate.getTime())
    .filter((log) => toDate === undefined || new Date(log.date).getTime() < toDate.getTime())
    .filter((log) => filterLogByLevels(log, levels))
    .filter((log) => filterLogBySearch(log, searchFilters))
    .sort(
      (firstLog, secondLog) =>
        new Date(secondLog.date).getTime() - new Date(firstLog.date).getTime()
    )
}

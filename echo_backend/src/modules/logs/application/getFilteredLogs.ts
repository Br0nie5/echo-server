import {
  createLogId,
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
 * With a `parseLogsSelfReportRepository`, that is when the self reports are enabled, every self
 * report it holds is read, once the logs are, and added to them, as a log of its own: those
 * `logsRepository` saved while reading the logs are therefore among them. Such a log keeps the
 * `date`, the `message`, the `level`, the `origin`, the `location`, the `locationName` and the
 * `groupName` of its self report, its job is the session the self report was reported during, and
 * its `id` the one `createLogId` gives it. Without one, the logs are those of `logsRepository`
 * alone.
 *
 * A log matches when it was logged at `fromDate` or later, before `toDate` when it is given, is in
 * one of the `levels` and passes every one of the `searchFilters`. Two lookups where the
 * `toDate` of the first is the `fromDate` of the second therefore never give the same log. The
 * filtering is done in memory, with `filterLogByLevels` and `filterLogBySearch`.
 *
 * ```ts
 * const logs = await getFilteredLogs(logsRepository, parseLogsSelfReportRepository, {
 *   fromDate,
 *   levels: ['ERROR'],
 *   searchFilters: []
 * })
 * ```
 */
export const getFilteredLogs = async (
  logsRepository: LogsRepository,
  parseLogsSelfReportRepository: SelfReportRepository | undefined,
  { fromDate, toDate, levels, searchFilters }: LogsFilters
): Promise<Log[]> => {
  const logs = await logsRepository.getAllLogs()

  const selfReports = (await parseLogsSelfReportRepository?.getAllSelfReports()) ?? []
  const selfReportsLogs = selfReports.map(
    ({ date, sessionId: jobId, ...selfReport }, index): Log => {
      const noIdLog: Omit<Log, 'id'> = { ...selfReport, date: date.toISOString(), jobId }

      return { ...noIdLog, id: createLogId(noIdLog, index) }
    }
  )

  return [...logs, ...selfReportsLogs]
    .filter((log) => new Date(log.date).getTime() >= fromDate.getTime())
    .filter((log) => toDate === undefined || new Date(log.date).getTime() < toDate.getTime())
    .filter((log) => filterLogByLevels(log, levels))
    .filter((log) => filterLogBySearch(log, searchFilters))
    .sort(
      (firstLog, secondLog) =>
        new Date(secondLog.date).getTime() - new Date(firstLog.date).getTime()
    )
}

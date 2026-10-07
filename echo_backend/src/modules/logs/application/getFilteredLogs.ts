import {
  filterLogByCategories,
  filterLogBySearch,
  type Log,
  type LogCategory,
  type LogSearchFilter
} from '@echo/utilities'

import type { LogsRepository } from '../domain/logs.repository.js'

/** Filters of a logs lookup. An empty `categories` or `searchFilters` matches everything. */
interface LogsFilters {
  fromDate: Date
  categories: LogCategory[]
  searchFilters: LogSearchFilter[]
}

/**
 * Returns the logs of `repository` matching `filters`, from the newest to the oldest.
 *
 * A log matches when it was logged at `fromDate` or later, is in one of the `categories` and
 * passes every one of the `searchFilters`. The filtering is done in memory, with the same
 * functions the frontend uses.
 */
export const getFilteredLogs = async (
  repository: LogsRepository,
  { fromDate, categories, searchFilters }: LogsFilters
): Promise<Log[]> => {
  const allLogs = await repository.findAllLogs()

  return allLogs
    .filter((log) => new Date(log.date).getTime() >= fromDate.getTime())
    .filter((log) => filterLogByCategories(log, categories))
    .filter((log) => filterLogBySearch(log, searchFilters))
    .sort(
      (firstLog, secondLog) =>
        new Date(secondLog.date).getTime() - new Date(firstLog.date).getTime()
    )
}

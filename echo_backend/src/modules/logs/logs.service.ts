import {
  filterLogByCategories,
  filterLogBySearch,
  type Log,
  type LogCategory,
  type LogSearchFilter
} from '@echo/utilities'

import type { LogsRepository } from './logs.repository.js'

/** Filters of a logs lookup. An empty `categories` or `searchFilters` matches everything. */
export interface LogsQuery {
  fromDate: Date
  categories: LogCategory[]
  searchFilters: LogSearchFilter[]
}

/** Business rules of the logs. */

/** Business rules of the logs lookup. */
export interface LogsService {
  getAllLastLogs: (query: LogsQuery) => Promise<Log[]>
}

/** Builds the logs service. The filtering is done in memory with the same functions the frontend uses. */
export const createLogsService = (repository: LogsRepository): LogsService => ({
  getAllLastLogs: async ({ fromDate, categories, searchFilters }: LogsQuery): Promise<Log[]> => {
    const allLogs = (await repository.findAll()).sort(
      (log1, log2) => new Date(log1.date).getTime() - new Date(log2.date).getTime()
    )

    return allLogs
      .filter((log) => new Date(log.date).getTime() >= fromDate.getTime())
      .filter((log) => filterLogByCategories(log, categories))
      .filter((log) => filterLogBySearch(log, searchFilters))
      .reverse()
  }
})

import type { Log, LogCategory, LogSearchFilter } from '@echo/utilities'

/**
 * Message sent to the filter worker.
 *
 * `setLogs` gives the worker the logs to filter, which it keeps until the next `setLogs`.
 * `filterLogs` asks which of them match the filters, and is the only one the worker answers.
 */
export type FilterWorkerRequest =
  | { type: 'setLogs'; logs: Log[] }
  | {
      type: 'filterLogs'
      logCategoriesFilters: LogCategory[]
      logSearchFilters: LogSearchFilter[]
    }

/**
 * Answer of the filter worker to a `filterLogs` request.
 *
 * `matchingLogIndexes` are the positions, in the logs the worker was given, of those matching the
 * filters.
 */
export interface FilterWorkerAnswer {
  matchingLogIndexes: number[]
}

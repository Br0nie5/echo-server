import { filterLogByCategories, filterLogBySearch, type Log } from '@echo/utilities'

import type { FilterWorkerAnswer, FilterWorkerRequest } from './filterWorkerMessages'

/** Handles one request of the filter worker, giving the answer to send back, if the request has one. */
type FilterWorkerRequestHandler = (request: FilterWorkerRequest) => FilterWorkerAnswer | undefined

/**
 * Creates what the filter worker does with its requests, keeping the logs it was last given.
 *
 * The logs are filtered with the same functions as the backend, so results are identical.
 *
 * ```ts
 * const handleFilterWorkerRequest = createFilterWorkerRequestHandler()
 * handleFilterWorkerRequest({ type: 'setLogs', logs })
 * const answer = handleFilterWorkerRequest({
 *   type: 'filterLogs',
 *   logCategoriesFilters: ['ERROR'],
 *   logSearchFilters: []
 * })
 * ```
 */
export const createFilterWorkerRequestHandler = (): FilterWorkerRequestHandler => {
  let logs: Log[] = []

  return (request) => {
    if (request.type === 'setLogs') {
      logs = request.logs
      return undefined
    }

    const matchingLogIndexes: number[] = []

    logs.forEach((log, logIndex) => {
      if (
        filterLogByCategories(log, request.logCategoriesFilters) &&
        filterLogBySearch(log, request.logSearchFilters)
      ) {
        matchingLogIndexes.push(logIndex)
      }
    })

    return { matchingLogIndexes }
  }
}

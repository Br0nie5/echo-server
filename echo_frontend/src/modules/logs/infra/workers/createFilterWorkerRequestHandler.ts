import { isLogMatchingLevels, isLogMatchingSearch, type Log } from '@echo/utilities'

import type { FilterWorkerAnswer, FilterWorkerRequest } from './filterWorkerMessages'

/** Handles one request of the filter worker, giving the answer to send back, if the request has one. */
type FilterWorkerRequestHandler = (request: FilterWorkerRequest) => FilterWorkerAnswer | undefined

/**
 * Creates what the filter worker does with its requests, keeping the logs it was last given.
 *
 * A `setLogs` request has no answer. A `filterLogs` one is answered with the positions of the logs
 * matching both the levels and the search (`isLogMatchingLevels`, `isLogMatchingSearch`).
 *
 * ```ts
 * const handleFilterWorkerRequest = createFilterWorkerRequestHandler()
 * handleFilterWorkerRequest({ type: 'setLogs', logs })
 * const answer = handleFilterWorkerRequest({
 *   type: 'filterLogs',
 *   logLevelsFilters: ['ERROR'],
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
        isLogMatchingLevels(log, request.logLevelsFilters) &&
        isLogMatchingSearch(log, request.logSearchFilters)
      ) {
        matchingLogIndexes.push(logIndex)
      }
    })

    return { matchingLogIndexes }
  }
}

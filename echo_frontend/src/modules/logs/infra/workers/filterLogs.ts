import type { Log, LogCategory, LogSearchFilter } from '@echo/utilities'

import type { LogsRepository } from '../../domain/logs.repository'

import FilterWorker from './filterWorker?worker'
import type { FilterWorkerAnswer, FilterWorkerRequest } from './filterWorkerMessages'

type FilterLogs = LogsRepository['filterLogs']

interface FilterRequest {
  logs: Log[]
  logCategoriesFilters: LogCategory[]
  logSearchFilters: LogSearchFilter[]
  resolve: (filteredLogs: Log[]) => void
  reject: (reason: unknown) => void
}

/**
 * Wraps a filter worker into a promise-returning function.
 *
 * The worker is given one request at a time, the others wait: a request aborted while it waits is
 * never sent. The logs are only sent when they are not the ones the worker already holds, and the
 * worker answers with indexes, so the logs given back are the very objects that were passed in.
 *
 * The promise rejects when the request is aborted, already when it is given, and when the worker
 * fails, after which every request is rejected.
 *
 * ```ts
 * const filterLogs = createFilterLogs(new FilterWorker())
 * const errorLogs = await filterLogs(logs, ['ERROR'], [])
 * ```
 */
export const createFilterLogs = (
  worker: Pick<Worker, 'postMessage' | 'onmessage' | 'onerror'>
): FilterLogs => {
  let logsHeldByWorker: Log[] | undefined
  let runningRequest: FilterRequest | undefined
  let waitingRequests: FilterRequest[] = []
  let workerFailure: Error | undefined

  const sendToWorker = (request: FilterWorkerRequest): void => worker.postMessage(request)

  const runNextRequest = (): void => {
    runningRequest = waitingRequests.shift()
    if (runningRequest === undefined) {
      return
    }

    const { logs, logCategoriesFilters, logSearchFilters } = runningRequest

    if (logs !== logsHeldByWorker) {
      sendToWorker({ type: 'setLogs', logs })
      logsHeldByWorker = logs
    }
    sendToWorker({ type: 'filterLogs', logCategoriesFilters, logSearchFilters })
  }

  worker.onmessage = ({ data: answer }: MessageEvent<FilterWorkerAnswer>): void => {
    if (runningRequest === undefined) {
      return
    }

    const { logs, resolve } = runningRequest

    resolve(answer.matchingLogIndexes.map((logIndex) => logs[logIndex]))
    runNextRequest()
  }

  worker.onerror = (errorEvent: ErrorEvent): void => {
    const failure = new Error(errorEvent.message)
    workerFailure = failure

    runningRequest?.reject(failure)
    waitingRequests.forEach((waitingRequest) => waitingRequest.reject(failure))
    runningRequest = undefined
    waitingRequests = []
  }

  return (logs, logCategoriesFilters, logSearchFilters, signal) =>
    new Promise((resolve, reject) => {
      if (workerFailure !== undefined) {
        reject(workerFailure)
        return
      }

      if (signal?.aborted) {
        reject(signal.reason)
        return
      }

      const stopListeningToSignal = new AbortController()

      const request: FilterRequest = {
        logs,
        logCategoriesFilters,
        logSearchFilters,
        resolve: (filteredLogs) => {
          stopListeningToSignal.abort()
          resolve(filteredLogs)
        },
        reject: (reason) => {
          stopListeningToSignal.abort()
          reject(reason)
        }
      }

      // An aborted request that is already running stays the running one until the worker
      // answers it: its late answer settles nothing, and the next request starts then.
      signal?.addEventListener(
        'abort',
        () => {
          waitingRequests = waitingRequests.filter((waitingRequest) => waitingRequest !== request)
          request.reject(signal.reason)
        },
        { once: true, signal: stopListeningToSignal.signal }
      )

      waitingRequests.push(request)
      if (runningRequest === undefined) {
        runNextRequest()
      }
    })
}

let filterLogsWithWorker: FilterLogs | undefined

/** Filters the logs in the app-wide filter worker, which is only started the first time logs need to be filtered. */
export const filterLogs: FilterLogs = (...filterArguments) => {
  filterLogsWithWorker ??= createFilterLogs(new FilterWorker())
  return filterLogsWithWorker(...filterArguments)
}

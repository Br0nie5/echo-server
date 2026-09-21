import type { Log, LogCategory, LogSearchFilter } from '@echo/utilities'

import FilterWorker from './filterWorker?worker'

/** Filters the logs by categories and search in the worker. */
type FilterLogs = (
  logs: Log[],
  logCategoriesFilters: LogCategory[],
  logSearchFilters: LogSearchFilter[]
) => Promise<Log[]>

/** Wraps a filter worker into a promise-returning function, matching answers to requests by id. */
export const createFilterLogs = (worker: Pick<Worker, 'postMessage' | 'onmessage'>): FilterLogs => {
  let requestId = 0
  const pending = new Map<number, (result: Log[]) => void>()

  worker.onmessage = (messageEvent): void => {
    pending.get(messageEvent.data.id)?.(messageEvent.data.result)
    pending.delete(messageEvent.data.id)
  }

  return (logs, logCategoriesFilters, logSearchFilters) =>
    new Promise((resolve) => {
      const id = ++requestId
      pending.set(id, resolve)
      worker.postMessage({ logs, logCategoriesFilters, logSearchFilters, id })
    })
}

let filterLogsWithWorker: FilterLogs | undefined

/** The app-wide filter worker is only started the first time logs need to be filtered. */
export const filterLogs: FilterLogs = (...args) => {
  filterLogsWithWorker ??= createFilterLogs(new FilterWorker())
  return filterLogsWithWorker(...args)
}

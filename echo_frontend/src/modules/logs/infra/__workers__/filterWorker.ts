import {
  filterLogByCategories,
  filterLogBySearch,
  type Log,
  type LogCategory,
  type LogSearchFilter
} from '@echo/utilities'

/** Request sent to the worker. `id` is echoed in the answer to match the two. */
interface MessageEventFilterLogsData {
  logs: Log[]
  logCategoriesFilters: LogCategory[]
  logSearchFilters: LogSearchFilter[]
  id: number
}

/** Answer sent by the worker. */
interface PostMessageData {
  result: Log[]
  id: number
}

/** Minimal typing of the worker global scope. */
interface SelfWorkerType {
  onmessage: (messageEvent: MessageEvent) => void
  postMessage: ({ result, id }: PostMessageData) => void
}

const ctx = self as unknown as SelfWorkerType

/** Filters off the main thread with the same functions as the backend, so results are identical. */
ctx.onmessage = (messageEvent: MessageEvent<MessageEventFilterLogsData>): void => {
  const { logs, logCategoriesFilters, logSearchFilters, id } = messageEvent.data

  const result = logs
    .filter((log) => filterLogByCategories(log, logCategoriesFilters))
    .filter((log) => filterLogBySearch(log, logSearchFilters))

  ctx.postMessage({ result, id })
}

import type { GetLogsParams, Log, LogCategory, LogSearchFilter } from '@echo/utilities'

/**
 * The logs of the server, and what the logs module needs from the outside for them.
 *
 * The domain only states what it needs: the `infra` folder holds the implementations, which are
 * free to filter where they want (another thread, the backend).
 */
export interface LogsRepository {
  /** Gives the logs matching `params`. Aborting `signal` cancels the search. Throws when the logs cannot be fetched, or when what is fetched is not a list of logs. */
  findLogs: (params: GetLogsParams, signal?: AbortSignal) => Promise<Log[]>
  /** Gives the logs of `logs` that match the category filters and the search filters. Aborting `signal` cancels the filtering. Throws when the logs cannot be filtered. */
  filterLogs: (
    logs: Log[],
    logCategoriesFilters: LogCategory[],
    logSearchFilters: LogSearchFilter[],
    signal?: AbortSignal
  ) => Promise<Log[]>
}

import type { GetLogsParams, Log, LogLevel, LogSearchFilter } from '@echo/utilities'

/**
 * The logs, as the logs module needs them from the outside.
 *
 * The domain only states what it needs: the `infra` folder holds the implementations, which are
 * free to filter where they want (another thread, the API).
 */
export interface LogsRepository {
  /**
   * Gives the logs matching `params`.
   *
   * Throws when the logs cannot be fetched, or when what is fetched is not a list of logs. Aborting
   * `signal` cancels the search.
   */
  findLogs: (params: GetLogsParams, signal?: AbortSignal) => Promise<Log[]>
  /**
   * Gives the logs of `logs` that match the level filters and the search filters.
   *
   * Throws when the logs cannot be filtered. Aborting `signal` cancels the filtering.
   */
  filterLogs: (
    logs: Log[],
    logLevelsFilters: LogLevel[],
    logSearchFilters: LogSearchFilter[],
    signal?: AbortSignal
  ) => Promise<Log[]>
}

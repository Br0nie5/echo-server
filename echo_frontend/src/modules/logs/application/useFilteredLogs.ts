import type { Log, LogCategory, LogSearchFilter } from '@echo/utilities'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useDebounce } from 'use-debounce'

import { useLogsRepository } from '../infra/useLogsRepository'

/**
 * Query giving the logs that match the filters.
 *
 * The filters are debounced so that typing does not trigger a filtering per keystroke, and a
 * filtering whose filters changed before it ended is cancelled. The previous result stays until
 * the new one is ready.
 *
 * The query key holds the ids of the logs rather than the logs, which TanStack Query would hash
 * whole each time it compares the keys.
 */
export const useFilteredLogs = (
  logs: Log[],
  logCategoriesFilters: LogCategory[],
  logSearchFilters: LogSearchFilter[]
): UseQueryResult<Log[], Error> => {
  const logsRepository = useLogsRepository()

  const logsIdsKey = useMemo(() => JSON.stringify(logs.map((log) => log.id)), [logs])

  const [debouncedCategories] = useDebounce(logCategoriesFilters, 150)
  const [debouncedSearch] = useDebounce(logSearchFilters, 150)

  return useQuery({
    queryKey: ['filteredLogs', logsIdsKey, debouncedCategories, debouncedSearch],
    queryFn: ({ signal }) =>
      logsRepository.filterLogs(logs, debouncedCategories, debouncedSearch, signal),
    placeholderData: (previousFilteredLogs) => previousFilteredLogs
  })
}

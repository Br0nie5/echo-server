import type { Log, LogCategory, LogSearchFilter } from '@echo/utilities'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'

import { filterLogs } from './__workers__/filterLogs'

/** Logs filtered in a worker, debounced so that typing does not trigger a filtering per keystroke. The previous result stays until the new one is ready. */
export const useFilteredLogs = (
  logs: Log[],
  logCategoriesFilters: LogCategory[],
  logSearchFilters: LogSearchFilter[]
): UseQueryResult<Log[], Error> => {
  const [debouncedCategories] = useDebounce(logCategoriesFilters, 150)
  const [debouncedSearch] = useDebounce(logSearchFilters, 150)

  return useQuery({
    queryKey: ['filteredLogs', logs, debouncedCategories, debouncedSearch],
    queryFn: () => filterLogs(logs, debouncedCategories, debouncedSearch),
    placeholderData: (prev) => prev // avoids flicker between filter changes
  })
}

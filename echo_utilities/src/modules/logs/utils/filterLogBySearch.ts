import type { Log } from '../types/__generated__/log.js'
import type { LogSearchableKeys, LogSearchFilter } from '../types/logSearchFilter.js'

/** Whether a field of the log contains `search` (already lower-cased). */
type LogFieldMatcher = (log: Log, search: string) => boolean

/** How to look for a search in each searchable field, case-insensitively. */
const logFieldMatchers: Record<LogSearchableKeys, LogFieldMatcher> = {
  fileName: (log, search) => log.fileName.toLowerCase().includes(search),
  groupName: (log, search) => log.groupName?.toLowerCase().includes(search) ?? false,
  jobId: (log, search) => log.jobId.toString().includes(search),
  message: (log, search) => log.message.toLowerCase().includes(search)
}

/** Whether the log matches the filter's search, in its `key` field or, without `key`, in any searchable field. */
const isMatchingLog = (log: Log, { key, search }: LogSearchFilter): boolean => {
  const lowerCaseSearch = search.toLowerCase()

  if (key !== undefined) {
    return logFieldMatchers[key](log, lowerCaseSearch)
  }

  return Object.values(logFieldMatchers).some((matcher) => matcher(log, lowerCaseSearch))
}

/** Whether the log satisfies every filter: matching the `find` ones, and not matching the `remove` ones. Shared by the backend and the frontend worker. */
export const filterLogBySearch = (log: Log, searchFilters: LogSearchFilter[]): boolean => {
  return searchFilters.every((searchFilter) => {
    const isMatching = isMatchingLog(log, searchFilter)

    return searchFilter.mode === 'find' ? isMatching : !isMatching
  })
}

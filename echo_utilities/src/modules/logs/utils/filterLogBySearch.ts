import type { LogSearchableKey } from '../consts/logSearchableKeys.js'
import type { Log } from '../schemas/log.schema.js'
import type { LogSearchFilter } from '../types/logSearchFilter.js'

/** Whether a field of the log contains `search` (already lower-cased). */
type LogFieldMatcher = (log: Log, search: string) => boolean

/** How to look for a search in each searchable field, case-insensitively. */
const logFieldMatchers: Record<LogSearchableKey, LogFieldMatcher> = {
  locationName: (log, search) => log.locationName.toLowerCase().includes(search),
  groupName: (log, search) => log.groupName?.toLowerCase().includes(search) ?? false,
  jobId: (log, search) => log.jobId.toString().includes(search),
  message: (log, search) => log.message.toLowerCase().includes(search)
}

/** Tells whether the log holds the search of the filter, in its `key` field or, without `key`, in any searchable field. */
const isMatchingLog = (log: Log, { key, search }: LogSearchFilter): boolean => {
  const lowerCaseSearch = search.toLowerCase()

  if (key !== undefined) {
    return logFieldMatchers[key](log, lowerCaseSearch)
  }

  return Object.values(logFieldMatchers).some((matcher) => matcher(log, lowerCaseSearch))
}

/**
 * Tells whether `log` satisfies every one of `searchFilters`.
 *
 * A filter is matched when its `search` is found, case-insensitively, in its `key` field of the log
 * or, without `key`, in any of the `logSearchableKeys` fields. The log satisfies a `find` filter by
 * matching it, and a `remove` one by not matching it. Without any filter, every log is kept.
 *
 * ```ts
 * const searchFilters = parseLogSearchInput('message:error -groupName:billing')
 * const foundLogs = logs.filter((log) => filterLogBySearch(log, searchFilters))
 * ```
 */
export const filterLogBySearch = (log: Log, searchFilters: LogSearchFilter[]): boolean => {
  return searchFilters.every((searchFilter) => {
    const isMatching = isMatchingLog(log, searchFilter)

    return searchFilter.mode === 'find' ? isMatching : !isMatching
  })
}

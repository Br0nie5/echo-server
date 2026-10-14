import type { LogSearchableKey } from '../consts/logSearchableKeys.js'
import type { Log } from '../schemas/log.schema.js'
import type { LogSearchFilter } from '../types/logSearchFilter.js'

/**
 * How to look for a search in each searchable field, case-insensitively: each one tells whether its
 * field of the log holds `search`, already lower-cased.
 */
const logFieldMatchers: Record<LogSearchableKey, (log: Log, search: string) => boolean> = {
  locationName: (log, search) => log.locationName.toLowerCase().includes(search),
  groupName: (log, search) => log.groupName?.toLowerCase().includes(search) ?? false,
  jobId: (log, search) => log.jobId.toString().includes(search),
  message: (log, search) => log.message.toLowerCase().includes(search)
}

/**
 * Tells whether the log holds the search of the filter, in its `key` field or, without `key`, in
 * any searchable field.
 */
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
 * matching it, and a `remove` one by not matching it. Without any filter, every log matches.
 *
 * ```ts
 * const searchFilters = parseLogSearchInput('message:error -groupName:billing')
 * const foundLogs = logs.filter((log) => isLogMatchingSearch(log, searchFilters))
 * ```
 */
export const isLogMatchingSearch = (log: Log, searchFilters: LogSearchFilter[]): boolean => {
  return searchFilters.every((searchFilter) => {
    const isMatching = isMatchingLog(log, searchFilter)

    return searchFilter.mode === 'find' ? isMatching : !isMatching
  })
}

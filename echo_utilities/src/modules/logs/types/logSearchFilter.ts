import type { Log } from './__generated__/log.js'

/** The log fields a search can target with `key:`. */
export type LogSearchableKeys = keyof Omit<Log, 'id' | 'date' | 'category'>

/** Keys proposed while typing a search, and recognised by `parseLogSearchInput`. */
export const logSearchSuggestions: LogSearchableKeys[] = [
  'jobId',
  'fileName',
  'message',
  'groupName'
]

/** One term of a search: `find` keeps the matching logs, `remove` drops them. Without `key`, any searchable field may match. */
export interface LogSearchFilter {
  key?: LogSearchableKeys
  mode: 'find' | 'remove'
  search: string
}

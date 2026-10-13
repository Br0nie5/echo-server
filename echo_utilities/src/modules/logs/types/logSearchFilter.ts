import type { LogSearchableKey } from '../consts/logSearchableKeys.js'

/** One term of a search, as `parseLogSearchInput` reads it from what the user typed. */
export interface LogSearchFilter {
  /** The only field the term is looked for in. When left out, any searchable field may match. */
  key?: LogSearchableKey
  /** `find` keeps the logs matching the term, `remove` drops them. */
  mode: 'find' | 'remove'
  /** The text looked for, case-insensitively. */
  search: string
}

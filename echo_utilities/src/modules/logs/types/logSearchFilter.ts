import type { Log } from '../schemas/log.schema.js'

/**
 * The log fields a search can target with `key:`, in the order they are proposed while typing.
 *
 * It is the single source of truth of the searchable fields: `LogSearchableKeys` is derived from it,
 * and `parseLogSearchInput` recognizes these keys only.
 */
export const logSearchSuggestions = ['jobId', 'fileName', 'message', 'groupName'] satisfies Array<
  keyof Log
>

/** A log field a search can target with `key:`. */
export type LogSearchableKeys = (typeof logSearchSuggestions)[number]

/** One term of a search: `find` keeps the matching logs, `remove` drops them. Without `key`, any searchable field may match. */
export interface LogSearchFilter {
  key?: LogSearchableKeys
  mode: 'find' | 'remove'
  search: string
}

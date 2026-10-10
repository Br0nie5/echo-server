import type { Log } from '../schemas/log.schema.js'

/**
 * The log fields a search can target with `key:`, in the order they are proposed while typing.
 *
 * It is the single source of truth of the searchable fields: `LogSearchableKey` is derived from it,
 * and `parseLogSearchInput` recognizes these keys only.
 */
export const logSearchableKeys = ['jobId', 'locationName', 'message', 'groupName'] satisfies Array<
  keyof Log
>

/** A log field a search can target with `key:`. */
export type LogSearchableKey = (typeof logSearchableKeys)[number]

/** One term of a search, as `parseLogSearchInput` reads it from what the user typed. */
export interface LogSearchFilter {
  /** The only field the term is looked for in. When left out, any searchable field may match. */
  key?: LogSearchableKey
  /** `find` keeps the logs matching the term, `remove` drops them. */
  mode: 'find' | 'remove'
  /** The text looked for, case-insensitively. */
  search: string
}

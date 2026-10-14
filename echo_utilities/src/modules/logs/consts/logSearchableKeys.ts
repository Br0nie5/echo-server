import type { Log } from '../schemas/log.schema.js'

/**
 * The log fields a search can target with `key:`.
 *
 * `LogSearchableKey` is inferred from it, and `parseLogSearchInput` recognizes these keys only. It
 * cannot be changed: copy it to get a list of your own.
 *
 * ```ts
 * const keySuggestions = logSearchableKeys.map((key) => `${key}:`)
 * ```
 */
export const logSearchableKeys = [
  'jobId',
  'locationName',
  'message',
  'groupName'
] as const satisfies ReadonlyArray<keyof Log>

/** A log field a search can target with `key:`. */
export type LogSearchableKey = (typeof logSearchableKeys)[number]

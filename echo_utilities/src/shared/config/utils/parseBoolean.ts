/**
 * Parses `raw` into a boolean.
 *
 * Throws when `raw` is anything but `true` or `false`.
 *
 * ```ts
 * parseBoolean('true') // true
 * parseBoolean('false') // false
 * ```
 */
export const parseBoolean = (raw: string): boolean => {
  if (raw === 'true') return true
  if (raw === 'false') return false
  throw new Error(`Invalid boolean: ${raw} is neither true nor false`)
}

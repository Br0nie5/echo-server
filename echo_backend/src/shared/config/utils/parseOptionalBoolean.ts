/**
 * Parses `raw` into a boolean.
 *
 * It is `false` when `raw` is missing or empty. Throws when `raw` is anything but `true` or
 * `false`.
 */
export const parseOptionalBoolean = (raw: string | undefined): boolean => {
  if (raw === undefined || raw === '') {
    return false
  }
  if (raw === 'true') return true
  if (raw === 'false') return false
  throw new Error(`Invalid boolean: ${raw} is neither true nor false`)
}

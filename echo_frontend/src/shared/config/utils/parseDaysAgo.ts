/**
 * Parses `value` into a number of days ago.
 *
 * `value` may be a number or the string of one, as `env.<mode>.json` holds its values as strings.
 * `key` is the name of the variable, for the message of the error. It throws when `value` is
 * missing, and when it is not a positive integer or zero.
 *
 * ```ts
 * parseDaysAgo('14', 'LOGS_MINIMAL_DATE_DAYS_AGO') // 14
 * ```
 */
export const parseDaysAgo = (value: unknown, key: string): number => {
  const isBlankString = typeof value === 'string' && value.trim() === ''
  if (value === undefined || value === null || isBlankString) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  const daysAgo = typeof value === 'string' ? Number(value) : value
  if (typeof daysAgo !== 'number' || !Number.isInteger(daysAgo) || daysAgo < 0) {
    throw new Error(`Invalid ${key}: ${String(value)} is not a positive integer or zero`)
  }
  return daysAgo
}

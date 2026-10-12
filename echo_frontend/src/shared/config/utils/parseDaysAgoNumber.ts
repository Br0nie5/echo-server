import { parseInteger } from '@echo/utilities'

/**
 * Parses `raw` into a number of days ago.
 *
 * It throws when `raw` is not an integer, or is negative.
 *
 * ```ts
 * parseDaysAgoNumber('14') // 14
 * ```
 */
export const parseDaysAgoNumber = (raw: string): number => {
  const daysAgoNumber = parseInteger(raw)
  if (daysAgoNumber < 0) {
    throw new Error(`Invalid number of days ago: ${raw} is negative`)
  }
  return daysAgoNumber
}

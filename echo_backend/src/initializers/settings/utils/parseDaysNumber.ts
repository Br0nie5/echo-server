import { parseInteger } from '@echo/utilities'

/**
 * Parses `raw` into a number of days.
 *
 * Throws when `raw` is not an integer, or is not strictly positive.
 */
export const parseDaysNumber = (raw: string): number => {
  const daysNumber = parseInteger(raw)
  if (daysNumber < 1) {
    throw new Error(`Invalid number of days: ${raw} is not strictly positive`)
  }
  return daysNumber
}

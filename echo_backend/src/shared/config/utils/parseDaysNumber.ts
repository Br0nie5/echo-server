/**
 * Parses `raw` into a number of days.
 *
 * It is `defaultDaysNumber` when `raw` is missing or empty. Throws when `raw` is missing or empty
 * and no `defaultDaysNumber` is given, or when `raw` is not a strictly positive integer.
 */
export const parseDaysNumber = (raw: string | undefined, defaultDaysNumber?: number): number => {
  if (raw === undefined || raw === '') {
    if (defaultDaysNumber === undefined) {
      throw new Error('Missing number of days')
    }
    return defaultDaysNumber
  }
  const daysNumber = Number(raw)
  if (!Number.isInteger(daysNumber) || daysNumber < 1) {
    throw new Error(`Invalid number of days: ${raw} is not a strictly positive integer`)
  }
  return daysNumber
}

import { DateTime } from 'luxon'

/**
 * Converts `isoDate`, an ISO date, to a `Date`, reading it as UTC when it carries no offset.
 *
 * Returns `undefined` when `isoDate` is not an ISO date.
 *
 * ```ts
 * convertToDateFromISO('2026-05-12T14:30:00.000') // 2026-05-12T14:30:00.000Z
 * convertToDateFromISO('May 12, 2026') // undefined
 * ```
 */
export const convertToDateFromISO = (isoDate: string): Date | undefined => {
  const parsedDate = DateTime.fromISO(isoDate, { zone: 'utc' })
  return parsedDate.isValid ? parsedDate.toJSDate() : undefined
}

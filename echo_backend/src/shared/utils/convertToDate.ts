import { DateTime } from 'luxon'

/** Parses an ISO date, read as UTC when it carries no offset. `undefined` if invalid. */
export const convertToDateFromISO = (isoDate: string): Date | undefined => {
  const parsedDate = DateTime.fromISO(isoDate, { zone: 'utc' })
  return parsedDate.isValid ? parsedDate.toJSDate() : undefined
}

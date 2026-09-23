import { DateTime } from 'luxon'

/** Parses an ISO date, read as UTC when it carries no offset. `undefined` if invalid. */
export const convertToDateFromISO = (dateStr: string): Date | undefined => {
  const parsedDate = DateTime.fromISO(dateStr, { zone: 'utc' })
  return parsedDate.isValid ? parsedDate.toJSDate() : undefined
}

/** Formats `date` (now, by default) the same way the log scripts write timestamps: ISO 8601 in UTC (`'yyyy-MM-ddTHH:mm:ss.SSSZ'`). */
export const formatDateForLog = (date: Date = new Date()): string => date.toISOString()

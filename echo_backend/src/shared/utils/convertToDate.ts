import { DateTime } from 'luxon'

/** Parses `dateStr` with the first matching Luxon format, read as Europe/Paris time. `undefined` if none matches. */
export const convertToDateFromFormat = (
  dateStr: string,
  formats = ['yyyy-MM-dd HH:mm:ss.SSS']
): Date | undefined => {
  for (const format of formats) {
    const parsedDate = DateTime.fromFormat(dateStr, format, { zone: 'Europe/Paris' })
    if (parsedDate.isValid) {
      return parsedDate.toJSDate()
    }
  }

  return undefined
}

/** Parses an ISO date, read as Europe/Paris time when it carries no offset. `undefined` if invalid. */
export const convertToDateFromISO = (dateStr: string): Date | undefined => {
  const parsedDate = DateTime.fromISO(dateStr, { zone: 'Europe/Paris' })
  return parsedDate.isValid ? parsedDate.toJSDate() : undefined
}

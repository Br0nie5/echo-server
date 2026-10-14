import type { AppTranslation } from '../i18n/useAppTranslation'

/**
 * Formats `date` as an instant, to the second, in the locale of the user (the language of their
 * browser), which orders its parts.
 *
 * ```ts
 * formatDateTime(new Date(2020, 4, 15, 13, 45, 30)) // '15/05/2020, 13:45:30' in British English
 * ```
 */
export const formatDateTime = (date: Date): string =>
  date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

/**
 * Formats the day `date` is in, in the locale of the user (the language of their browser), which
 * orders the parts and names the days and months.
 *
 * Today and yesterday are given as such instead, translated with `translation`.
 *
 * ```ts
 * formatDay(new Date(2020, 4, 15), translation) // 'Friday, 15 May 2020' in British English
 * ```
 */
export const formatDay = (date: Date, translation: AppTranslation): string => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (today.toDateString() === date.toDateString()) {
    return translation('date.today')
  }

  if (yesterday.toDateString() === date.toDateString()) {
    return translation('date.yesterday')
  }

  return date.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

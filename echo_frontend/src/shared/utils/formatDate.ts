import type { AppTranslation } from '../i18n/useAppTranslation'

/** Available date formats, named after what they render. */
type FormatType = 'year/month/day - hour:minutes:seconds' | 'dayName day monthName year'

const formatOptions: Record<FormatType, Intl.DateTimeFormatOptions> = {
  'year/month/day - hour:minutes:seconds': {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  },
  'dayName day monthName year': {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
}

/**
 * Formats `date` the way `formatType` names, in the locale of the user (the language of their
 * browser), which orders the parts and names the days and months.
 *
 * `dayName day monthName year` renders today and yesterday as such instead, with `translation`.
 *
 * ```ts
 * formatDate(new Date(2020, 4, 15), 'dayName day monthName year', translation)
 * // 'Friday, 15 May 2020' in British English
 * ```
 */
export const formatDate = (
  date: Date,
  formatType: FormatType,
  translation: AppTranslation
): string => {
  if (formatType === 'dayName day monthName year') {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    if (today.toDateString() === date.toDateString()) {
      return translation('utils.today')
    }

    if (yesterday.toDateString() === date.toDateString()) {
      return translation('utils.yesterday')
    }
  }

  return date.toLocaleString(undefined, formatOptions[formatType])
}

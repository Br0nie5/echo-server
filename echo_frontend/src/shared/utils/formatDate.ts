import type { AppTranslation } from '../i18n/useAppTranslation'

/**
 * What a date is formatted for: `dateTime` for an instant (`15/05/2020, 13:45:30` in British
 * English), `day` for the day it is in (`Friday, 15 May 2020`).
 */
type DateFormat = 'dateTime' | 'day'

const formatOptions: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  dateTime: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  },
  day: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
}

/**
 * Formats `date` in `dateFormat`, in the locale of the user (the language of their browser),
 * which orders the parts and names the days and months.
 *
 * The `day` format gives today and yesterday as such instead, translated with `translation`.
 *
 * ```ts
 * formatDate(new Date(2020, 4, 15), 'day', translation) // 'Friday, 15 May 2020' in British English
 * ```
 */
export const formatDate = (
  date: Date,
  dateFormat: DateFormat,
  translation: AppTranslation
): string => {
  if (dateFormat === 'day') {
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

  return date.toLocaleString(undefined, formatOptions[dateFormat])
}

import type { AppTranslation } from '../i18n/useAppTranslation'

/** Available date formats, named after what they render. */
type FormatType = 'year/month/day - hour:minutes:seconds' | 'dayName day monthName year'

/** Formats the date. `dayName day monthName year` renders today and yesterday as such, using `translation`. */
export const formatDate = (
  date: Date,
  formatType: FormatType,
  translation: AppTranslation
): string => {
  let format: Intl.DateTimeFormatOptions

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  switch (formatType) {
    case 'dayName day monthName year':
      if (today.toDateString() === date.toDateString()) {
        return translation('utils.today')
      }

      if (yesterday.toDateString() === date.toDateString()) {
        return translation('utils.yesterday')
      }

      format = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
      break

    case 'year/month/day - hour:minutes:seconds':
      format = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }
      break
  }

  return date.toLocaleDateString('en-UK', format)
}

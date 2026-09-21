import { describe, it, expect } from 'vitest'

import i18n from '../../i18n/i18n'
import type { AppTranslation } from '../../i18n/useAppTranslation'
import { formatDate } from '../formatDate'

const appTranslation: AppTranslation = (key) => i18n.t(key)

describe('formatDate', () => {
  it('should return "Today" if date is today', () => {
    const today = new Date()
    const result = formatDate(today, 'dayName day monthName year', appTranslation)
    expect(result).toBe('Today')
  })

  it('should return "Yesterday" if date is yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const result = formatDate(yesterday, 'dayName day monthName year', appTranslation)
    expect(result).toBe('Yesterday')
  })

  it('should format date with default format if not today or yesterday', () => {
    const someDate = new Date('2020-05-15')
    const result = formatDate(someDate, 'dayName day monthName year', appTranslation)

    expect(result).toMatch('Friday, 15 May 2020')
  })

  it('should format date with custom format if given', () => {
    const someDate = new Date('2020-05-15T13:45:30')
    const result = formatDate(someDate, 'year/month/day - hour:minutes:seconds', appTranslation)

    expect(result).toMatch('15/05/2020, 13:45:30')
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '../../i18n/i18n'
import type { AppTranslation } from '../../i18n/useAppTranslation'
import { formatDate } from '../formatDate'

const appTranslation: AppTranslation = (key) => i18n.t(key)

const NOW = new Date(2026, 3, 28, 10, 0, 0)

describe('formatDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Should return "Today" if date is today', () => {
    const result = formatDate(
      new Date(2026, 3, 28, 23, 59),
      'dayName day monthName year',
      appTranslation
    )
    expect(result).toBe('Today')
  })

  it('Should return "Yesterday" if date is yesterday', () => {
    const result = formatDate(
      new Date(2026, 3, 27, 0, 0),
      'dayName day monthName year',
      appTranslation
    )
    expect(result).toBe('Yesterday')
  })

  it('Should format date with default format if not today or yesterday', () => {
    const result = formatDate(
      new Date(2026, 3, 26, 23, 59),
      'dayName day monthName year',
      appTranslation
    )

    expect(result).toBe('Sunday, 26 April 2026')
  })

  it('Should format date with custom format if given', () => {
    const someDate = new Date('2020-05-15T13:45:30')
    const result = formatDate(someDate, 'year/month/day - hour:minutes:seconds', appTranslation)

    expect(result).toBe('15/05/2020, 13:45:30')
  })
})

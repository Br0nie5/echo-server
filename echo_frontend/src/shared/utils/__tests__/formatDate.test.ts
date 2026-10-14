import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { appTranslation } from '../../../test/utils/appTranslation'
import { formatDate } from '../formatDate'

const NOW = new Date(2026, 3, 28, 10, 0, 0)

describe('formatDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('day', () => {
    it('Should give today for a date of today', () => {
      const result = formatDate(new Date(2026, 3, 28, 23, 59), 'day', appTranslation)

      expect(result).toBe(appTranslation('utils.today'))
    })

    it('Should give yesterday for a date of yesterday', () => {
      const result = formatDate(new Date(2026, 3, 27, 0, 0), 'day', appTranslation)

      expect(result).toBe(appTranslation('utils.yesterday'))
    })

    it('Should give the name of the day, the day, the month and the year of an older date', () => {
      const result = formatDate(new Date(2026, 3, 26, 23, 59), 'day', appTranslation)

      expect(result).toBe('Sunday, 26 April 2026')
    })
  })

  describe('dateTime', () => {
    it('Should give the date and the time, to the second, even for a date of today', () => {
      const result = formatDate(new Date(2026, 3, 28, 9, 45, 30), 'dateTime', appTranslation)

      expect(result).toBe('28/04/2026, 09:45:30')
    })
  })
})

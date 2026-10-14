import { appTranslation } from '../../../test/utils/appTranslation'
import { formatDateTime, formatDay } from '../formatDates'

const NOW = new Date(2026, 3, 28, 10, 0, 0)

describe('formatDateTime', () => {
  it('Should give the date and the time, to the second', () => {
    expect(formatDateTime(new Date(2026, 3, 28, 9, 45, 30))).toBe('28/04/2026, 09:45:30')
  })
})

describe('formatDay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Should give today for a date of today', () => {
    expect(formatDay(new Date(2026, 3, 28, 23, 59), appTranslation)).toBe(
      appTranslation('date.today')
    )
  })

  it('Should give yesterday for a date of yesterday', () => {
    expect(formatDay(new Date(2026, 3, 27, 0, 0), appTranslation)).toBe(
      appTranslation('date.yesterday')
    )
  })

  it('Should give the name of the day, the day, the month and the year of an older date', () => {
    expect(formatDay(new Date(2026, 3, 26, 23, 59), appTranslation)).toBe('Sunday, 26 April 2026')
  })
})

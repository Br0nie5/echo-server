import { getDateFromDaysAgo } from '../getDateFromDaysAgo'

describe('getDateFromDaysAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 26, 15, 42, 7, 123))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('Should return the beginning of today for 0 days ago', () => {
    expect(getDateFromDaysAgo(0)).toStrictEqual(new Date(2026, 3, 26))
  })

  test('Should return the beginning of the day the given number of days ago', () => {
    expect(getDateFromDaysAgo(2)).toStrictEqual(new Date(2026, 3, 24))
  })

  test('Should go back over the previous month', () => {
    expect(getDateFromDaysAgo(30)).toStrictEqual(new Date(2026, 2, 27))
  })
})

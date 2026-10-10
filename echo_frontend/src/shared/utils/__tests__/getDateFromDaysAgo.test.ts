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

  describe('Around a change of the clocks', () => {
    /** 00:30 in Paris, the day after the clocks went forward: that day only lasted 23 hours. */
    const AFTER_SPRING_FORWARD = new Date('2026-03-29T22:30:00.000Z')

    beforeEach(() => {
      vi.stubEnv('TZ', 'Europe/Paris')
      vi.setSystemTime(AFTER_SPRING_FORWARD)
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    test('Should count a day the clocks changed as one day', () => {
      expect(getDateFromDaysAgo(1)).toStrictEqual(new Date('2026-03-28T23:00:00.000Z'))
    })
  })
})

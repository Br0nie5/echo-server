import { parseDaysAgo } from '../parseDaysAgo'

const key = 'LOGS_INITIAL_DATE_DAYS_AGO'

describe('parseDaysAgo', () => {
  test('Should parse the string of a positive integer', () => {
    expect(parseDaysAgo('14', key)).toBe(14)
  })

  test('Should keep a number as it is', () => {
    expect(parseDaysAgo(2, key)).toBe(2)
  })

  test('Should accept zero', () => {
    expect(parseDaysAgo('0', key)).toBe(0)
  })

  test.each([undefined, null, '', '   '])('Should throw if the value is missing (%j)', (value) => {
    expect(() => parseDaysAgo(value, key)).toThrow(`Missing required environment variable: ${key}`)
  })

  test.each(['two', '1.5', '-1', -3, true])(
    'Should throw if the value is not a positive integer or zero (%j)',
    (value) => {
      expect(() => parseDaysAgo(value, key)).toThrow(
        `Invalid ${key}: ${String(value)} is not a positive integer or zero`
      )
    }
  )
})

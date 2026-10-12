import { parseDaysAgoNumber } from '../parseDaysAgoNumber'

describe('parseDaysAgoNumber', () => {
  test.each([
    { raw: '0', daysAgoNumber: 0 },
    { raw: '14', daysAgoNumber: 14 }
  ])('Should parse "$raw", which is not negative', ({ raw, daysAgoNumber }) => {
    expect(parseDaysAgoNumber(raw)).toBe(daysAgoNumber)
  })

  test('Should throw if the value is negative', () => {
    expect(() => parseDaysAgoNumber('-1')).toThrow('Invalid number of days ago: -1 is negative')
  })
})

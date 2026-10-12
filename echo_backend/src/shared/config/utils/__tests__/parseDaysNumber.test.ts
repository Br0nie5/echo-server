import { describe, it, expect } from 'vitest'

import { parseDaysNumber } from '../parseDaysNumber.js'

describe('parseDaysNumber', () => {
  it.each([
    { raw: '1', daysNumber: 1 },
    { raw: '30', daysNumber: 30 }
  ])('Should parse "$raw", which is strictly positive', ({ raw, daysNumber }) => {
    expect(parseDaysNumber(raw)).toBe(daysNumber)
  })

  it.each(['0', '-3'])('Should throw when set to "%s", which is not strictly positive', (raw) => {
    expect(() => parseDaysNumber(raw)).toThrow(
      `Invalid number of days: ${raw} is not strictly positive`
    )
  })
})

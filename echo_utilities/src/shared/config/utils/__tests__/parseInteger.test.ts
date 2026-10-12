import { describe, it, expect } from 'vitest'

import { parseInteger } from '../parseInteger.js'

describe('parseInteger', () => {
  it.each([
    { raw: '14', integer: 14 },
    { raw: '0', integer: 0 },
    { raw: '-3', integer: -3 },
    { raw: '007', integer: 7 }
  ])('Should parse "$raw" into $integer', ({ raw, integer }) => {
    expect(parseInteger(raw)).toBe(integer)
  })

  it.each(['ten', '1.5', '1e3', ' 5', '', '-', '0x10'])(
    'Should throw when "%s" is not an integer',
    (raw) => {
      expect(() => parseInteger(raw)).toThrow(`Invalid integer: ${raw} is not an integer`)
    }
  )
})

import { describe, it, expect } from 'vitest'

import { parseBoolean } from '../parseBoolean.js'

describe('parseBoolean', () => {
  it.each([
    { raw: 'true', boolean: true },
    { raw: 'false', boolean: false }
  ])('Should parse "$raw" into $boolean', ({ raw, boolean }) => {
    expect(parseBoolean(raw)).toBe(boolean)
  })

  it.each(['yes', 'no', 'TRUE', 'False', '1', '0', ' true', ''])(
    'Should throw when "%s" is neither true nor false',
    (raw) => {
      expect(() => parseBoolean(raw)).toThrow(
        new Error(`Invalid boolean: ${raw} is neither true nor false`)
      )
    }
  )
})

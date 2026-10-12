import { describe, it, expect } from 'vitest'

import { parseBoolean } from '../parseBoolean.js'

describe('parseBoolean', () => {
  it('Should be true when set to "true"', () => {
    expect(parseBoolean('true')).toBe(true)
  })

  it('Should be false when set to "false"', () => {
    expect(parseBoolean('false')).toBe(false)
  })

  it.each(['yes', 'TRUE', '1', ''])('Should throw when set to "%s"', (raw) => {
    expect(() => parseBoolean(raw)).toThrow(`Invalid boolean: ${raw} is neither true nor false`)
  })
})

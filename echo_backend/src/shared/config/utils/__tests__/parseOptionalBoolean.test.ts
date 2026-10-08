import { describe, it, expect } from 'vitest'

import { parseOptionalBoolean } from '../parseOptionalBoolean.js'

describe('parseOptionalBoolean', () => {
  it('should default to false when unset', () => {
    expect(parseOptionalBoolean(undefined)).toBe(false)
  })

  it('should default to false when empty', () => {
    expect(parseOptionalBoolean('')).toBe(false)
  })

  it('should be true when set to "true"', () => {
    expect(parseOptionalBoolean('true')).toBe(true)
  })

  it('should be false when set to "false"', () => {
    expect(parseOptionalBoolean('false')).toBe(false)
  })

  it('should throw when set to an invalid value', () => {
    expect(() => parseOptionalBoolean('yes')).toThrow(
      'Invalid boolean: yes is neither true nor false'
    )
  })
})

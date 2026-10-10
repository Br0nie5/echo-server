import { describe, it, expect } from 'vitest'

import { parseOptionalBoolean } from '../parseOptionalBoolean.js'

describe('parseOptionalBoolean', () => {
  it('Should default to false when unset', () => {
    expect(parseOptionalBoolean(undefined)).toBe(false)
  })

  it('Should default to false when empty', () => {
    expect(parseOptionalBoolean('')).toBe(false)
  })

  it('Should be true when set to "true"', () => {
    expect(parseOptionalBoolean('true')).toBe(true)
  })

  it('Should be false when set to "false"', () => {
    expect(parseOptionalBoolean('false')).toBe(false)
  })

  it('Should throw when set to an invalid value', () => {
    expect(() => parseOptionalBoolean('yes')).toThrow(
      'Invalid boolean: yes is neither true nor false'
    )
  })
})

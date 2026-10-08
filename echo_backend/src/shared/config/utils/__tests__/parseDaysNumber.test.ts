import { describe, it, expect } from 'vitest'

import { parseDaysNumber } from '../parseDaysNumber.js'

describe('parseDaysNumber', () => {
  it('should use the given value when set', () => {
    expect(parseDaysNumber('30')).toBe(30)
  })

  it('should use the given value over the default number of days', () => {
    expect(parseDaysNumber('30', 10)).toBe(30)
  })

  it('should default to the default number of days when unset', () => {
    expect(parseDaysNumber(undefined, 10)).toBe(10)
  })

  it('should default to the default number of days when empty', () => {
    expect(parseDaysNumber('', 10)).toBe(10)
  })

  it('should throw when unset without a default number of days', () => {
    expect(() => parseDaysNumber(undefined)).toThrow('Missing number of days')
  })

  it('should throw when empty without a default number of days', () => {
    expect(() => parseDaysNumber('')).toThrow('Missing number of days')
  })

  it('should throw when set to zero', () => {
    expect(() => parseDaysNumber('0', 10)).toThrow(
      'Invalid number of days: 0 is not a strictly positive integer'
    )
  })

  it('should throw when set to a negative number', () => {
    expect(() => parseDaysNumber('-3', 10)).toThrow(
      'Invalid number of days: -3 is not a strictly positive integer'
    )
  })

  it('should throw when set to a value that is not an integer', () => {
    expect(() => parseDaysNumber('1.5', 10)).toThrow(
      'Invalid number of days: 1.5 is not a strictly positive integer'
    )
    expect(() => parseDaysNumber('ten', 10)).toThrow(
      'Invalid number of days: ten is not a strictly positive integer'
    )
  })
})

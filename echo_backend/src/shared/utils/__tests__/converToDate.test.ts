import { describe, it, expect } from 'vitest'

import {
  convertToDateFromFormat,
  convertToDateFromISO,
  formatDateForLog
} from '../convertToDate.js'

// Dates are read as Europe/Paris time (UTC+1 or UTC+2 depending on DST), so the expectations are
// written in UTC: the local getters would depend on the timezone of the machine running the tests.

describe('convertToDateFromFormat', () => {
  it('should parse a valid date string with default format', () => {
    const result = convertToDateFromFormat('2024-05-12 14:30:00.123')
    expect(result).toBeInstanceOf(Date)
    expect(result?.getUTCFullYear()).toBe(2024)
    expect(result?.getUTCMonth()).toBe(4) // May = 4 (0-indexed)
    expect(result?.getUTCDate()).toBe(12)
    expect(result?.getUTCHours()).toBe(12) // 14:30 in Paris, on 12 May (UTC+2)
    expect(result?.getUTCMinutes()).toBe(30)
    expect(result?.getUTCSeconds()).toBe(0)
    expect(result?.getUTCMilliseconds()).toBe(123)
  })

  it('should parse a valid date string with a custom format', () => {
    const result = convertToDateFromFormat('12/05/2024 14:30', ['dd/MM/yyyy HH:mm'])
    expect(result).toBeInstanceOf(Date)
    expect(result?.getUTCFullYear()).toBe(2024)
    expect(result?.getUTCMonth()).toBe(4)
    expect(result?.getUTCDate()).toBe(12)
  })

  it('should return undefined for invalid date string', () => {
    const result = convertToDateFromFormat('2024-99-99 99:99:99')
    expect(result).toBeUndefined()
  })
})

describe('convertToDateFromISO', () => {
  it('should parse a valid ISO string', () => {
    const result = convertToDateFromISO('2024-05-12T14:30:00.000Z')
    expect(result).toBeInstanceOf(Date)
    expect(result?.getUTCFullYear()).toBe(2024)
    expect(result?.getUTCMonth()).toBe(4)
    expect(result?.getUTCDate()).toBe(12)
    expect(result?.getUTCHours()).toBe(14)
  })

  it('should return undefined for an invalid ISO string', () => {
    const result = convertToDateFromISO('not-a-date')
    expect(result).toBeUndefined()
  })
})

describe('formatDateForLog', () => {
  it('should format a date the same way log timestamps are parsed', () => {
    // 2024-05-12T12:30:00.123Z is 14:30:00.123 in Paris (UTC+2, DST)
    const result = formatDateForLog(new Date('2024-05-12T12:30:00.123Z'))
    expect(result).toBe('2024-05-12 14:30:00.123')
  })

  it('should default to the current date when none is given', () => {
    const result = formatDateForLog()
    expect(convertToDateFromFormat(result)).toBeInstanceOf(Date)
  })
})

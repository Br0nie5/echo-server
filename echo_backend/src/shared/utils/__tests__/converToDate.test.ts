import { describe, it, expect } from 'vitest'

import { convertToDateFromISO, formatDateForLog } from '../convertToDate.js'

// Dates without an offset are read as UTC, so the expectations use the UTC getters: the local
// getters would depend on the timezone of the machine running the tests.

describe('convertToDateFromISO', () => {
  it('should parse a valid ISO string', () => {
    const result = convertToDateFromISO('2024-05-12T14:30:00.000Z')
    expect(result).toBeInstanceOf(Date)
    expect(result?.getUTCFullYear()).toBe(2024)
    expect(result?.getUTCMonth()).toBe(4)
    expect(result?.getUTCDate()).toBe(12)
    expect(result?.getUTCHours()).toBe(14)
  })

  it('should respect the offset of an ISO string', () => {
    const result = convertToDateFromISO('2024-05-12T14:30:00.000+02:00')
    expect(result?.toISOString()).toBe('2024-05-12T12:30:00.000Z')
  })

  it('should read an ISO string without offset as UTC', () => {
    const result = convertToDateFromISO('2024-05-12T14:30:00.000')
    expect(result?.toISOString()).toBe('2024-05-12T14:30:00.000Z')
  })

  it('should return undefined for a date in the old `yyyy-MM-dd HH:mm:ss.SSS` format', () => {
    const result = convertToDateFromISO('2024-05-12 14:30:00.123')
    expect(result).toBeUndefined()
  })

  it('should return undefined for an invalid ISO string', () => {
    const result = convertToDateFromISO('not-a-date')
    expect(result).toBeUndefined()
  })
})

describe('formatDateForLog', () => {
  it('should format a date as an ISO string in UTC', () => {
    const result = formatDateForLog(new Date('2024-05-12T12:30:00.123Z'))
    expect(result).toBe('2024-05-12T12:30:00.123Z')
  })

  it('should default to the current date when none is given', () => {
    const result = formatDateForLog()
    expect(convertToDateFromISO(result)).toBeInstanceOf(Date)
  })
})

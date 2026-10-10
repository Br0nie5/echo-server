import { LogCategory, type GetLogsParams } from '@echo/utilities'
import { describe, it, expect } from 'vitest'

import { safeParseGetLogsParams } from '../safeParseGetLogsParams.js'

/** The `fromDate` the client sends. */
const FROM_DATE = '2026-01-01T00:00:00.000Z'

describe('safeParseGetLogsParams', () => {
  it('Should parse a valid query with no logCategories or logSearch', () => {
    const result = safeParseGetLogsParams({ fromDate: FROM_DATE })

    expect(result.success).toBeTruthy()
    if (result.success) {
      expect(result.data.fromDate).toEqual(new Date(FROM_DATE))
      expect(result.data.logCategories).toEqual([])
    }
  })

  it('Should leave toDate out when the client sends none', () => {
    const result = safeParseGetLogsParams({ fromDate: FROM_DATE })

    expect(result.success && result.data.toDate).toBeUndefined()
  })

  it('Should convert toDate to a Date', () => {
    const result = safeParseGetLogsParams({
      fromDate: '2026-01-01T00:00:00.000Z',
      toDate: '2026-01-02T00:00:00.000Z'
    })

    expect(result.success && result.data.toDate).toEqual(new Date('2026-01-02T00:00:00.000Z'))
  })

  it('Should fail with a specific message when toDate is not an ISO date', () => {
    const result = safeParseGetLogsParams({
      fromDate: '2026-01-01T00:00:00.000Z',
      toDate: 'not a date'
    })

    expect(result.success).toBeFalsy()
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Field toDate is not a valid date, it should be an ISO string'
      )
    }
  })

  it('Should normalize a single logCategories value into an array', () => {
    const result = safeParseGetLogsParams({
      fromDate: FROM_DATE,
      logCategories: LogCategory.INFO
    })

    expect(result.success).toBeTruthy()
    if (result.success) {
      expect(result.data.logCategories).toEqual([LogCategory.INFO])
    }
  })

  it('Should keep an array of logCategories values as-is', () => {
    const result = safeParseGetLogsParams({
      fromDate: FROM_DATE,
      logCategories: [LogCategory.INFO, LogCategory.ERROR]
    })

    expect(result.success).toBeTruthy()
    if (result.success) {
      expect(result.data.logCategories).toEqual([LogCategory.INFO, LogCategory.ERROR])
    }
  })

  it('Should pass through logSearch', () => {
    const result = safeParseGetLogsParams({
      fromDate: FROM_DATE,
      logSearch: 'message:boom'
    })

    expect(result.success).toBeTruthy()
    if (result.success) {
      expect(result.data.logSearch).toBe('message:boom')
    }
  })

  it('Should fail with a specific message when fromDate is missing', () => {
    const result = safeParseGetLogsParams({} as unknown as GetLogsParams)

    expect(result.success).toBeFalsy()
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Missing required field: fromDate')
    }
  })

  it('Should fail with a specific message when fromDate is present but not a string', () => {
    const result = safeParseGetLogsParams({ fromDate: 12345 } as unknown as GetLogsParams)

    expect(result.success).toBeFalsy()
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Field fromDate is not a valid date, it should be an ISO string'
      )
    }
  })

  it('Should fail with a specific message when fromDate is not a valid ISO date', () => {
    const result = safeParseGetLogsParams({ fromDate: 'invalid-date' })

    expect(result.success).toBeFalsy()
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Field fromDate is not a valid date, it should be an ISO string'
      )
    }
  })

  it('Should fail with a specific message when a logCategories value is invalid', () => {
    const result = safeParseGetLogsParams({
      fromDate: FROM_DATE,
      logCategories: 'Invalid_log_category'
    } as unknown as GetLogsParams)

    expect(result.success).toBeFalsy()
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        `Invalid_log_category is not a valid log category, use ${Object.values(LogCategory).join('|')}`
      )
    }
  })

  it('Should report the fromDate issue before a logCategories issue when both are invalid', () => {
    const result = safeParseGetLogsParams({
      logCategories: 'Invalid_log_category'
    } as unknown as GetLogsParams)

    expect(result.success).toBeFalsy()
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Missing required field: fromDate')
    }
  })
})

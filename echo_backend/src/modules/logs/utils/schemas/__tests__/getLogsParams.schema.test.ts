import { LogCategory } from '@echo/utilities'
import { describe, it, expect } from 'vitest'

import { GetLogsParamsSchema } from '../getLogsParams.schema.js'

describe('GetLogsParamsSchema', () => {
  it('should parse a valid query with no logCategories or logSearch', () => {
    const isoDate = new Date().toISOString()
    const result = GetLogsParamsSchema.safeParse({ fromDate: isoDate })

    expect(result.success).toBeTruthy()
    if (result.success) {
      expect(result.data.fromDate).toEqual(new Date(isoDate))
      expect(result.data.logCategories).toEqual([])
    }
  })

  it('should normalize a single logCategories value into an array', () => {
    const result = GetLogsParamsSchema.safeParse({
      fromDate: new Date().toISOString(),
      logCategories: LogCategory.INFO
    })

    expect(result.success).toBeTruthy()
    if (result.success) {
      expect(result.data.logCategories).toEqual([LogCategory.INFO])
    }
  })

  it('should keep an array of logCategories values as-is', () => {
    const result = GetLogsParamsSchema.safeParse({
      fromDate: new Date().toISOString(),
      logCategories: [LogCategory.INFO, LogCategory.ERROR]
    })

    expect(result.success).toBeTruthy()
    if (result.success) {
      expect(result.data.logCategories).toEqual([LogCategory.INFO, LogCategory.ERROR])
    }
  })

  it('should pass through logSearch', () => {
    const result = GetLogsParamsSchema.safeParse({
      fromDate: new Date().toISOString(),
      logSearch: 'message:boom'
    })

    expect(result.success).toBeTruthy()
    if (result.success) {
      expect(result.data.logSearch).toBe('message:boom')
    }
  })

  it('should fail with a specific message when fromDate is missing', () => {
    const result = GetLogsParamsSchema.safeParse({})

    expect(result.success).toBeFalsy()
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Missing required field: fromDate')
    }
  })

  it('should fail with a specific message when fromDate is present but not a string', () => {
    const result = GetLogsParamsSchema.safeParse({ fromDate: 12345 })

    expect(result.success).toBeFalsy()
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Field fromDate is not a valid date, it should be an ISO string'
      )
    }
  })

  it('should fail with a specific message when fromDate is not a valid ISO date', () => {
    const result = GetLogsParamsSchema.safeParse({ fromDate: 'invalid-date' })

    expect(result.success).toBeFalsy()
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Field fromDate is not a valid date, it should be an ISO string'
      )
    }
  })

  it('should fail with a specific message when a logCategories value is invalid', () => {
    const result = GetLogsParamsSchema.safeParse({
      fromDate: new Date().toISOString(),
      logCategories: 'Invalid_log_category'
    })

    expect(result.success).toBeFalsy()
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        `Invalid_log_category is not a valid log category, use ${Object.values(LogCategory).join('|')}`
      )
    }
  })

  it('should report the fromDate issue before a logCategories issue when both are invalid', () => {
    const result = GetLogsParamsSchema.safeParse({ logCategories: 'Invalid_log_category' })

    expect(result.success).toBeFalsy()
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Missing required field: fromDate')
    }
  })
})

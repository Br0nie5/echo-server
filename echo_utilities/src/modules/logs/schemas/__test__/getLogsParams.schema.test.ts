import { describe, it, expect } from 'vitest'

import { GetLogsParamsSchema, getInvalidDateFieldMessage } from '../getLogsParams.schema.js'
import { LogCategory } from '../logCategory.schema.js'

const fromDate = '2026-04-28T10:00:00.000Z'
const usableLogCategories = Object.values(LogCategory).join('|')

describe('GetLogsParamsSchema', () => {
  it('should accept a query with only fromDate', () => {
    expect(GetLogsParamsSchema.safeParse({ fromDate }).data).toEqual({ fromDate })
  })

  it('should accept a toDate', () => {
    const query = { fromDate, toDate: '2026-04-28T12:00:00.000Z' }

    expect(GetLogsParamsSchema.safeParse(query).data).toEqual(query)
  })

  it('should fail with a specific message when toDate is not a string', () => {
    const result = GetLogsParamsSchema.safeParse({ fromDate, toDate: 12345 })

    expect(result.error?.issues[0]?.message).toBe(
      'Field toDate is not a valid date, it should be an ISO string'
    )
  })

  it('should accept a single log category', () => {
    const query = { fromDate, logCategories: LogCategory.INFO }

    expect(GetLogsParamsSchema.safeParse(query).data).toEqual(query)
  })

  it('should accept several log categories', () => {
    const query = { fromDate, logCategories: [LogCategory.INFO, LogCategory.ERROR] }

    expect(GetLogsParamsSchema.safeParse(query).data).toEqual(query)
  })

  it('should accept a logSearch', () => {
    const query = { fromDate, logSearch: 'message:boom' }

    expect(GetLogsParamsSchema.safeParse(query).data).toEqual(query)
  })

  it('should fail with a specific message when fromDate is missing', () => {
    const result = GetLogsParamsSchema.safeParse({})

    expect(result.error?.issues[0]?.message).toBe('Missing required field: fromDate')
  })

  it('should fail with a specific message when fromDate is not a string', () => {
    const result = GetLogsParamsSchema.safeParse({ fromDate: 12345 })

    expect(result.error?.issues[0]?.message).toBe(
      'Field fromDate is not a valid date, it should be an ISO string'
    )
  })

  it('should fail with a specific message when the log category is invalid', () => {
    const result = GetLogsParamsSchema.safeParse({
      fromDate,
      logCategories: 'Invalid_log_category'
    })

    expect(result.error?.issues[0]?.message).toBe(
      `Invalid_log_category is not a valid log category, use ${usableLogCategories}`
    )
  })

  it('should name the invalid log category among several ones', () => {
    const result = GetLogsParamsSchema.safeParse({
      fromDate,
      logCategories: [LogCategory.INFO, 'Invalid_log_category']
    })

    expect(result.error?.issues[0]?.message).toBe(
      `Invalid_log_category is not a valid log category, use ${usableLogCategories}`
    )
  })

  it('should report the fromDate issue before a logCategories issue when both are invalid', () => {
    const result = GetLogsParamsSchema.safeParse({ logCategories: 'Invalid_log_category' })

    expect(result.error?.issues[0]?.message).toBe('Missing required field: fromDate')
  })
})

describe('getInvalidDateFieldMessage', () => {
  it('should name the date field that is not an ISO date', () => {
    expect(getInvalidDateFieldMessage('toDate')).toBe(
      'Field toDate is not a valid date, it should be an ISO string'
    )
  })
})

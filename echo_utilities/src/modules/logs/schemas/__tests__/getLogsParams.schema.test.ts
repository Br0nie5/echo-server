import { describe, it, expect } from 'vitest'

import { GetLogsParamsSchema, getInvalidDateFieldMessage } from '../getLogsParams.schema.js'
import { LogLevel } from '../logLevel.schema.js'

const fromDate = '2026-04-28T10:00:00.000Z'
const usableLogLevels = Object.values(LogLevel).join('|')

describe('GetLogsParamsSchema', () => {
  it('Should accept a query with only fromDate', () => {
    expect(GetLogsParamsSchema.safeParse({ fromDate }).data).toEqual({ fromDate })
  })

  it('Should accept a toDate', () => {
    const query = { fromDate, toDate: '2026-04-28T12:00:00.000Z' }

    expect(GetLogsParamsSchema.safeParse(query).data).toEqual(query)
  })

  it('Should fail with a specific message when toDate is not a string', () => {
    const result = GetLogsParamsSchema.safeParse({ fromDate, toDate: 12345 })

    expect(result.error?.issues[0]?.message).toBe(
      'Field toDate is not a valid date, it should be an ISO string'
    )
  })

  it('Should accept a single log level', () => {
    const query = { fromDate, logLevels: LogLevel.INFO }

    expect(GetLogsParamsSchema.safeParse(query).data).toEqual(query)
  })

  it('Should accept several log levels', () => {
    const query = { fromDate, logLevels: [LogLevel.INFO, LogLevel.ERROR] }

    expect(GetLogsParamsSchema.safeParse(query).data).toEqual(query)
  })

  it('Should accept a logSearch', () => {
    const query = { fromDate, logSearch: 'message:boom' }

    expect(GetLogsParamsSchema.safeParse(query).data).toEqual(query)
  })

  it('Should fail with a specific message when fromDate is missing', () => {
    const result = GetLogsParamsSchema.safeParse({})

    expect(result.error?.issues[0]?.message).toBe('Missing required field: fromDate')
  })

  it('Should fail with a specific message when fromDate is not a string', () => {
    const result = GetLogsParamsSchema.safeParse({ fromDate: 12345 })

    expect(result.error?.issues[0]?.message).toBe(
      'Field fromDate is not a valid date, it should be an ISO string'
    )
  })

  it('Should fail with a specific message when the log level is invalid', () => {
    const result = GetLogsParamsSchema.safeParse({
      fromDate,
      logLevels: 'Invalid_log_level'
    })

    expect(result.error?.issues[0]?.message).toBe(
      `Invalid_log_level is not a valid log level, use ${usableLogLevels}`
    )
  })

  it('Should name the invalid log level among several ones', () => {
    const result = GetLogsParamsSchema.safeParse({
      fromDate,
      logLevels: [LogLevel.INFO, 'Invalid_log_level']
    })

    expect(result.error?.issues[0]?.message).toBe(
      `Invalid_log_level is not a valid log level, use ${usableLogLevels}`
    )
  })

  it('Should report the fromDate issue before a logLevels issue when both are invalid', () => {
    const result = GetLogsParamsSchema.safeParse({ logLevels: 'Invalid_log_level' })

    expect(result.error?.issues[0]?.message).toBe('Missing required field: fromDate')
  })
})

describe('getInvalidDateFieldMessage', () => {
  it('Should name the date field that is not an ISO date', () => {
    expect(getInvalidDateFieldMessage('toDate')).toBe(
      'Field toDate is not a valid date, it should be an ISO string'
    )
  })
})

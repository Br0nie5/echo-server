import { describe, it, expect } from 'vitest'

import type { GetLogsParams } from '../getLogsParams.schema.js'
import { GetLogsParamsSchema, getInvalidDateFieldMessage } from '../getLogsParams.schema.js'
import { LogLevel } from '../logLevel.schema.js'

const fromDate = '2026-04-28T10:00:00.000Z'
const toDate = '2026-04-28T12:00:00.000Z'

const missingFromDateMessage = 'Missing required field: fromDate'
const invalidFromDateMessage = 'Field fromDate is not a valid date, it should be an ISO string'
const invalidToDateMessage = 'Field toDate is not a valid date, it should be an ISO string'
const invalidLogLevelMessage = 'DEBUG is not a valid log level, use SUCCESS|INFO|WARNING|ERROR'

const getIssuesMessages = (query: unknown): string[] | undefined =>
  GetLogsParamsSchema.safeParse(query).error?.issues.map((issue) => issue.message)

describe('GetLogsParamsSchema', () => {
  it.each<GetLogsParams>([
    { fromDate },
    { fromDate, toDate },
    { fromDate, logLevels: LogLevel.INFO },
    { fromDate, logLevels: [LogLevel.INFO, LogLevel.ERROR] },
    { fromDate, logLevels: [] },
    { fromDate, logSearch: 'message:boom -groupName:billing' },
    { fromDate, toDate, logLevels: [LogLevel.WARNING], logSearch: 'boom' }
  ])('Should accept the query %j', (query) => {
    expect(GetLogsParamsSchema.parse(query)).toEqual(query)
  })

  it('Should accept a date that is a text without checking that it is a date', () => {
    const query: GetLogsParams = { fromDate: 'yesterday', toDate: 'tomorrow' }

    expect(GetLogsParamsSchema.parse(query)).toEqual(query)
  })

  it.each([
    { reason: 'fromDate is missing', query: {}, message: missingFromDateMessage },
    {
      reason: 'fromDate is not a text',
      query: { fromDate: 12345 },
      message: invalidFromDateMessage
    },
    { reason: 'fromDate is null', query: { fromDate: null }, message: invalidFromDateMessage },
    {
      reason: 'toDate is not a text',
      query: { fromDate, toDate: 12345 },
      message: invalidToDateMessage
    },
    {
      reason: 'the log level is not one',
      query: { fromDate, logLevels: 'DEBUG' },
      message: invalidLogLevelMessage
    },
    {
      reason: 'one of the log levels is not one',
      query: { fromDate, logLevels: [LogLevel.INFO, 'DEBUG'] },
      message: invalidLogLevelMessage
    }
  ])('Should tell the client that $reason', ({ query, message }) => {
    expect(getIssuesMessages(query)).toEqual([message])
  })

  it('Should tell the client every field that is wrong', () => {
    expect(getIssuesMessages({ toDate: 12345, logLevels: 'DEBUG' })).toEqual([
      missingFromDateMessage,
      invalidToDateMessage,
      invalidLogLevelMessage
    ])
  })

  it('Should refuse a logSearch that is not a text', () => {
    expect(GetLogsParamsSchema.safeParse({ fromDate, logSearch: 42 }).success).toBe(false)
  })
})

describe('getInvalidDateFieldMessage', () => {
  it.each(['fromDate', 'toDate'])('Should name %s as the field that is not a date', (fieldName) => {
    expect(getInvalidDateFieldMessage(fieldName)).toBe(
      `Field ${fieldName} is not a valid date, it should be an ISO string`
    )
  })
})

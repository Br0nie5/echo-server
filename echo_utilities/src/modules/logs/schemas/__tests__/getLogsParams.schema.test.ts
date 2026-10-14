import { describe, it, expect } from 'vitest'

import type { GetLogsParams } from '../getLogsParams.schema.js'
import { GetLogsParamsSchema } from '../getLogsParams.schema.js'
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

  it.each(['2026-04-28T10:00:00Z', '2026-04-28T12:00:00.000+02:00'])(
    'Should accept the date %s, an ISO one with its time zone',
    (date) => {
      const query: GetLogsParams = { fromDate: date, toDate: date }

      expect(GetLogsParamsSchema.parse(query)).toEqual(query)
    }
  )

  it.each([
    { reason: 'fromDate is missing', query: {}, message: missingFromDateMessage },
    {
      reason: 'fromDate is not a text',
      query: { fromDate: 12345 },
      message: invalidFromDateMessage
    },
    { reason: 'fromDate is null', query: { fromDate: null }, message: invalidFromDateMessage },
    {
      reason: 'fromDate is no date',
      query: { fromDate: 'yesterday' },
      message: invalidFromDateMessage
    },
    {
      reason: 'fromDate has no time',
      query: { fromDate: '2026-04-28' },
      message: invalidFromDateMessage
    },
    {
      reason: 'fromDate has no time zone',
      query: { fromDate: '2026-04-28T10:00:00.000' },
      message: invalidFromDateMessage
    },
    {
      reason: 'fromDate is a day that does not exist',
      query: { fromDate: '2026-02-30T10:00:00.000Z' },
      message: invalidFromDateMessage
    },
    {
      reason: 'toDate is not a text',
      query: { fromDate, toDate: 12345 },
      message: invalidToDateMessage
    },
    {
      reason: 'toDate is no date',
      query: { fromDate, toDate: 'tomorrow' },
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
    },
    {
      reason: 'a list given in place of a log level is not one',
      query: { fromDate, logLevels: [[LogLevel.INFO]] },
      message: '["INFO"] is not a valid log level, use SUCCESS|INFO|WARNING|ERROR'
    },
    {
      reason: 'an object given in place of a log level is not one',
      query: { fromDate, logLevels: { level: LogLevel.INFO } },
      message: '{"level":"INFO"} is not a valid log level, use SUCCESS|INFO|WARNING|ERROR'
    },
    {
      reason: 'a number is not a log level',
      query: { fromDate, logLevels: 3 },
      message: '3 is not a valid log level, use SUCCESS|INFO|WARNING|ERROR'
    },
    {
      reason: 'null is not a log level',
      query: { fromDate, logLevels: null },
      message: 'null is not a valid log level, use SUCCESS|INFO|WARNING|ERROR'
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

  it('Should leave out the properties it does not describe', () => {
    expect(GetLogsParamsSchema.parse({ fromDate, page: 2 })).toEqual({ fromDate })
  })

  it('Should refuse a logSearch that is not a text', () => {
    expect(GetLogsParamsSchema.safeParse({ fromDate, logSearch: 42 }).success).toBe(false)
  })
})

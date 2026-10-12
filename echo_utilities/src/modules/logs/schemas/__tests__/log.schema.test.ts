import { describe, it, expect } from 'vitest'

import type { Log } from '../log.schema.js'
import { LogArraySchema, LogSchema } from '../log.schema.js'
import { LogLevel } from '../logLevel.schema.js'

const log: Log = {
  id: 'log-id',
  contentId: 'log-content-id',
  date: '2026-04-28T10:00:00.000Z',
  groupName: 'billing',
  location: '/storage/send_invoices',
  locationName: 'send_invoices',
  jobId: 66,
  level: LogLevel.INFO,
  message: 'Invoices sent.',
  origin: 'send_invoices.sh:12'
}

const omitField = (field: keyof Log): Partial<Log> =>
  Object.fromEntries(Object.entries(log).filter(([key]) => key !== field))

describe('LogSchema', () => {
  it('Should accept a log with every field', () => {
    expect(LogSchema.parse(log)).toEqual(log)
  })

  it.each<keyof Log>(['groupName', 'origin'])(
    'Should accept a log without %s, which is optional',
    (optionalField) => {
      expect(LogSchema.safeParse(omitField(optionalField)).success).toBe(true)
    }
  )

  it('Should accept an origin in any form', () => {
    expect(LogSchema.safeParse({ ...log, origin: 'the monthly invoicing' }).success).toBe(true)
  })

  it.each<keyof Log>([
    'id',
    'contentId',
    'date',
    'location',
    'locationName',
    'jobId',
    'level',
    'message'
  ])('Should refuse a log without %s, which is required', (requiredField) => {
    expect(LogSchema.safeParse(omitField(requiredField)).success).toBe(false)
  })

  it.each([
    { reason: 'with an empty origin', difference: { origin: '' } },
    { reason: 'with a level that is not one', difference: { level: 'DEBUG' } },
    { reason: 'with a jobId that is not an integer', difference: { jobId: 1.5 } },
    { reason: 'with a jobId written as a text', difference: { jobId: '66' } },
    { reason: 'with a property it does not describe', difference: { hostname: 'my-server' } }
  ])('Should refuse a log $reason', ({ difference }) => {
    expect(LogSchema.safeParse({ ...log, ...difference }).success).toBe(false)
  })
})

describe('LogArraySchema', () => {
  it.each([{ logs: [] }, { logs: [log] }, { logs: [log, { ...log, id: 'other-log-id' }] }])(
    'Should accept $logs.length logs',
    ({ logs }) => {
      expect(LogArraySchema.parse(logs)).toEqual(logs)
    }
  )

  it('Should refuse logs when one of them is not a log', () => {
    expect(LogArraySchema.safeParse([log, { ...log, jobId: 'not a number' }]).success).toBe(false)
  })

  it('Should refuse a log that is not in an array', () => {
    expect(LogArraySchema.safeParse(log).success).toBe(false)
  })
})

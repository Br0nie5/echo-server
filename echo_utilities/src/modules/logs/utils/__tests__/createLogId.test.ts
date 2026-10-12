import { describe, it, expect } from 'vitest'

import type { Log } from '../../schemas/log.schema.js'
import { LogLevel } from '../../schemas/logLevel.schema.js'
import { createLogId } from '../createLogId.js'

const noIdsLog: Omit<Log, 'id' | 'contentId'> = {
  date: '2026-04-28T10:00:00.000Z',
  groupName: 'billing',
  location: '/storage/send_invoices',
  locationName: 'send_invoices',
  jobId: 66,
  level: LogLevel.WARNING,
  message: 'Quota almost reached',
  origin: 'send_invoices.sh:12'
}

describe('createLogId', () => {
  it('Should be made of the id number, the date, the job, the location, the level, the message and the origin', () => {
    expect(createLogId(noIdsLog, 3)).toBe(
      '{"idNumber":3,"date":"2026-04-28T10:00:00.000Z","jobId":66,"location":"/storage/send_invoices","level":"WARNING","message":"Quota almost reached","origin":"send_invoices.sh:12"}'
    )
  })

  it('Should leave the origin out when the log has none', () => {
    expect(createLogId({ ...noIdsLog, origin: undefined }, 3)).toBe(
      '{"idNumber":3,"date":"2026-04-28T10:00:00.000Z","jobId":66,"location":"/storage/send_invoices","level":"WARNING","message":"Quota almost reached"}'
    )
  })

  it('Should be another one for the same log with another id number', () => {
    expect(createLogId(noIdsLog, 4)).not.toBe(createLogId(noIdsLog, 3))
  })

  it.each<Partial<Log>>([
    { date: '2026-04-29T10:00:00.000Z' },
    { jobId: 67 },
    { location: '/storage/other' },
    { level: LogLevel.ERROR },
    { message: 'Quota reached' },
    { origin: 'send_invoices.sh:13' },
    { origin: undefined }
  ])('Should be another one for a log that differs by %o', (difference) => {
    expect(createLogId({ ...noIdsLog, ...difference }, 3)).not.toBe(createLogId(noIdsLog, 3))
  })

  it.each<Partial<Log>>([{ groupName: 'other' }, { locationName: 'other' }])(
    'Should be the same for a log that only differs by %o',
    (difference) => {
      expect(createLogId({ ...noIdsLog, ...difference }, 3)).toBe(createLogId(noIdsLog, 3))
    }
  )
})

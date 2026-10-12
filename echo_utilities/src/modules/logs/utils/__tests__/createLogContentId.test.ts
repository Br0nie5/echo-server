import { describe, it, expect } from 'vitest'

import type { Log } from '../../schemas/log.schema.js'
import { LogLevel } from '../../schemas/logLevel.schema.js'
import { createLogContentId } from '../createLogContentId.js'

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

describe('createLogContentId', () => {
  it('Should be made of the location, the level, the message and the origin', () => {
    expect(createLogContentId(noIdsLog)).toBe(
      '{"location":"/storage/send_invoices","level":"WARNING","message":"Quota almost reached","origin":"send_invoices.sh:12"}'
    )
  })

  it('Should leave the origin out when the log has none', () => {
    expect(createLogContentId({ ...noIdsLog, origin: undefined })).toBe(
      '{"location":"/storage/send_invoices","level":"WARNING","message":"Quota almost reached"}'
    )
  })

  it.each<Partial<Log>>([
    { date: '2026-04-29T10:00:00.000Z' },
    { jobId: 67 },
    { groupName: 'other' },
    { locationName: 'other' }
  ])('Should be the same for a log that only differs by %o', (difference) => {
    expect(createLogContentId({ ...noIdsLog, ...difference })).toBe(createLogContentId(noIdsLog))
  })

  it.each<Partial<Log>>([
    { location: '/storage/other' },
    { level: LogLevel.ERROR },
    { message: 'Quota reached' },
    { origin: 'send_invoices.sh:13' },
    { origin: undefined }
  ])('Should be another one for a log that differs by %o', (difference) => {
    expect(createLogContentId({ ...noIdsLog, ...difference })).not.toBe(
      createLogContentId(noIdsLog)
    )
  })
})

import { describe, it, expect } from 'vitest'

import type { Log } from '../../schemas/log.schema.js'
import { LogLevel } from '../../schemas/logLevel.schema.js'
import { createLogId } from '../createLogId.js'

const noIdLog: Omit<Log, 'id'> = {
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
  it.each([
    {
      origin: 'send_invoices.sh:12',
      id: '{"idNumber":3,"date":"2026-04-28T10:00:00.000Z","jobId":66,"location":"/storage/send_invoices","level":"WARNING","message":"Quota almost reached","origin":"send_invoices.sh:12"}'
    },
    {
      origin: undefined,
      id: '{"idNumber":3,"date":"2026-04-28T10:00:00.000Z","jobId":66,"location":"/storage/send_invoices","level":"WARNING","message":"Quota almost reached"}'
    }
  ])(
    'Should be made of the id number, the date, the job, the location, the level, the message and the origin, which is $origin',
    ({ origin, id }) => {
      expect(createLogId({ ...noIdLog, origin }, 3)).toBe(id)
    }
  )

  it('Should be another one for the same log with another id number', () => {
    expect(createLogId(noIdLog, 4)).not.toBe(createLogId(noIdLog, 3))
  })

  it.each<Partial<Log>>([
    { date: '2026-04-29T10:00:00.000Z' },
    { jobId: 67 },
    { location: '/storage/other' },
    { level: LogLevel.ERROR },
    { message: 'Quota reached' },
    { origin: 'send_invoices.sh:13' }
  ])('Should be another one for a log that differs by %o', (difference) => {
    expect(createLogId({ ...noIdLog, ...difference }, 3)).not.toBe(createLogId(noIdLog, 3))
  })

  it.each<Partial<Log>>([{ groupName: 'other' }, { locationName: 'other' }])(
    'Should be the same for a log that only differs by %o',
    (difference) => {
      expect(createLogId({ ...noIdLog, ...difference }, 3)).toBe(createLogId(noIdLog, 3))
    }
  )
})

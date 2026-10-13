import { describe, it, expect } from 'vitest'

import type { Log } from '../../schemas/log.schema.js'
import { LogLevel } from '../../schemas/logLevel.schema.js'
import { filterLogByLevels } from '../filterLogByLevels.js'

const infoLog: Log = {
  id: 'log-id',
  date: '2026-04-25T22:00:00.000Z',
  groupName: 'billing',
  location: '/storage/send_invoices',
  locationName: 'send_invoices',
  jobId: 123,
  level: LogLevel.INFO,
  message: 'Invoices sent.',
  origin: 'send_invoices.sh:12'
}

const everyLevel = Object.values(LogLevel)

describe('filterLogByLevels', () => {
  it.each(everyLevel)('Should keep a %s log when its level is the one asked for', (level) => {
    expect(filterLogByLevels({ ...infoLog, level }, [level])).toBe(true)
  })

  it('Should keep a log when its level is one of those asked for', () => {
    expect(filterLogByLevels(infoLog, [LogLevel.ERROR, LogLevel.INFO])).toBe(true)
  })

  it('Should leave out a log when its level is none of those asked for', () => {
    expect(filterLogByLevels(infoLog, [LogLevel.WARNING, LogLevel.ERROR])).toBe(false)
  })

  it.each(everyLevel)('Should keep a %s log when no level is asked for', (level) => {
    expect(filterLogByLevels({ ...infoLog, level }, [])).toBe(true)
  })
})

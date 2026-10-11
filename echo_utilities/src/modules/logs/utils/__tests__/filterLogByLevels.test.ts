import { describe, it, expect } from 'vitest'

import type { Log } from '../../schemas/log.schema.js'
import { LogLevel } from '../../schemas/logLevel.schema.js'
import { createLogWithIds } from '../createLogWithIds.js'
import { filterLogByLevels } from '../filterLogByLevels.js'

describe('filterLogByLevels', () => {
  const log: Log = createLogWithIds(
    {
      date: '2026-04-25T22:00:00.000Z',
      groupName: 'log_group_name',
      location: '/server/log_group_name/logs/log_file_name.jsonl',
      locationName: 'log_file_name',
      jobId: 123,
      level: LogLevel.INFO,
      message: 'some log message',
      origin: '/server/log_group_name/log_file_name.sh:1'
    },
    0
  )

  it('Should match log with the correct level', () => {
    Object.values(LogLevel).forEach((level) => {
      expect(filterLogByLevels({ ...log, level }, [level])).toBeTruthy()
    })
  })

  it('Should not match log with the wrong level', () => {
    const level = LogLevel.ERROR

    expect(log.level).not.toBe(level)
    expect(filterLogByLevels(log, [level])).toBeFalsy()
  })

  it('Should match log if there is no levels to match', () => {
    Object.values(LogLevel).forEach((level) => {
      expect(filterLogByLevels({ ...log, level }, [])).toBeTruthy()
    })
  })
})

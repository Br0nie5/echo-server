import { describe, it, expect } from 'vitest'

import type { Log } from '../../schemas/log.schema.js'
import { LogCategory } from '../../schemas/logCategory.schema.js'
import { createLogWithIds } from '../createLogWithIds.js'
import { filterLogByCategories } from '../filterLogByCategories.js'

describe('filterLogByCategories', () => {
  const log: Log = createLogWithIds(
    {
      date: '2026-04-25T22:00:00.000Z',
      groupName: 'log_group_name',
      location: '/server/log_group_name/log/log_file_name.jsonl',
      locationName: 'log_file_name',
      jobId: 123,
      category: LogCategory.INFO,
      message: 'some log message',
      origin: '/server/log_group_name/log_file_name.sh:1'
    },
    0
  )

  it('Should match log with the correct category', () => {
    Object.values(LogCategory).forEach((category) => {
      expect(filterLogByCategories({ ...log, category }, [category])).toBeTruthy()
    })
  })

  it('Should not match log with the wrong category', () => {
    const category = LogCategory.ERROR

    expect(log.category).not.toBe(category)
    expect(filterLogByCategories(log, [category])).toBeFalsy()
  })

  it('Should match log if there is no categories to match', () => {
    Object.values(LogCategory).forEach((category) => {
      expect(filterLogByCategories({ ...log, category }, [])).toBeTruthy()
    })
  })
})

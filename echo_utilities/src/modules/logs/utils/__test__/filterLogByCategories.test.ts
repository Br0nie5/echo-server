import { describe, it, expect } from 'vitest'

import type { Log } from '../../types/__generated__/log'
import { LogCategory } from '../../types/__generated__/logCategory'
import { filterLogByCategories } from '../filterLogByCategories'

describe('filterLogByCategories', () => {
  const log: Log = {
    id: 'log id 1',
    date: '2026-04-25T22:00:00.000Z',
    groupName: 'log group name',
    fileName: 'log_file_name',
    jobId: 123,
    category: LogCategory.INFO,
    message: 'some log message'
  }

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

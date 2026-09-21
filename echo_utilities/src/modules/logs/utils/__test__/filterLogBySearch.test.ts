import { describe, it, expect } from 'vitest'

import type { Log } from '../../types/__generated__/log'
import { LogCategory } from '../../types/__generated__/logCategory'
import type { LogSearchableKeys } from '../../types/logSearchFilter'
import { filterLogBySearch } from '../filterLogBySearch'

describe('filterLogBySearch', () => {
  const log: Log = {
    id: 'log id 1',
    date: '2026-04-25T22:00:00.000Z',
    groupName: 'log group name',
    fileName: 'log_file_name',
    jobId: 123,
    category: LogCategory.INFO,
    message: 'some log message'
  }

  const expectMatch = (key: LogSearchableKeys): void => {
    expect(
      filterLogBySearch(log, [
        {
          key,
          mode: 'find',
          search: log[`${key}`]?.toString() ?? ''
        }
      ])
    ).toBeTruthy()

    expect(
      filterLogBySearch(log, [
        {
          key,
          mode: 'remove',
          search: log[`${key}`]?.toString() ?? ''
        }
      ])
    ).toBeFalsy()

    expect(
      filterLogBySearch(log, [
        {
          key,
          mode: 'find',
          search: log[`${key}`]?.toString() ?? ''
        },
        {
          key,
          mode: 'remove',
          search: log[`${key}`]?.toString() ?? ''
        }
      ])
    ).toBeFalsy()
  }

  it('Should match log individual fields', () => {
    expectMatch('fileName')
    expectMatch('groupName')
    expectMatch('jobId')
    expectMatch('message')
  })

  it('Should not match undefined group name', () => {
    expect(
      filterLogBySearch({ ...log, groupName: undefined }, [
        {
          key: 'groupName',
          mode: 'find',
          search: 'undefined'
        }
      ])
    ).toBeFalsy()
  })

  it('Should match without being case sensitive', () => {
    expect(
      filterLogBySearch({ ...log, fileName: 'MY_FILE_NAME' }, [
        {
          key: 'fileName',
          mode: 'find',
          search: 'my_file_name'
        }
      ])
    ).toBeTruthy()
  })

  it('Should not match if at least one of the filter is not matching', () => {
    expect(
      filterLogBySearch(log, [
        {
          mode: 'find',
          search: 'not_matching_anything'
        },
        {
          mode: 'find',
          search: log.message
        }
      ])
    ).toBeFalsy()
  })

  it('Should match any field of log if key is all', () => {
    expect(
      filterLogBySearch(log, [
        {
          mode: 'find',
          search: log.fileName
        }
      ])
    ).toBeTruthy()

    expect(
      filterLogBySearch(log, [
        {
          mode: 'remove',
          search: log.groupName ?? ''
        }
      ])
    ).toBeFalsy()

    expect(
      filterLogBySearch(log, [
        {
          mode: 'find',
          search: log.jobId.toString()
        }
      ])
    ).toBeTruthy()

    expect(
      filterLogBySearch(log, [
        {
          mode: 'remove',
          search: log.message
        }
      ])
    ).toBeFalsy()
  })
})

import type { Log } from '@echo/utilities'
import { describe, expect, it } from 'vitest'

import { groupLogsByDay } from '../groupLogsByDay'
import { groupLogsByGroup } from '../groupLogsByGroup'
import { groupLogsByJob } from '../groupLogsByJob'

const buildLog = (overrides: Partial<Log>): Log => ({
  id: 'id',
  date: '2026-01-02T10:00:00.000Z',
  jobId: 1,
  category: 'INFO',
  fileName: 'file',
  message: 'message',
  callFile: 'file.sh',
  callLine: 1,
  ...overrides
})

describe('groupLogsByDay', () => {
  it('should group the logs of the same day and put the most recent day first', () => {
    const newestLogs = [
      buildLog({ id: 'a', date: '2026-01-03T10:00:00.000Z' }),
      buildLog({ id: 'b', date: '2026-01-03T09:00:00.000Z' })
    ]
    const oldestLog = buildLog({ id: 'c', date: '2026-01-01T10:00:00.000Z' })

    const result = groupLogsByDay([...newestLogs, oldestLog])

    expect(result.map(({ logs }) => logs)).toEqual([newestLogs, [oldestLog]])
    expect(result[0].date.getHours()).toBe(12)
  })

  it('should return no group when there are no logs', () => {
    expect(groupLogsByDay([])).toEqual([])
  })
})

describe('groupLogsByGroup', () => {
  it('should group the logs by group name, keeping the logs without group apart', () => {
    const logs = [
      buildLog({ id: 'a', groupName: 'docker', date: '2026-01-02T10:00:00.000Z' }),
      buildLog({ id: 'b', date: '2026-01-02T09:00:00.000Z' }),
      buildLog({ id: 'c', groupName: 'docker', date: '2026-01-02T08:00:00.000Z' })
    ]

    const result = groupLogsByGroup(logs, 'day-1')

    expect(result).toEqual([
      { id: 'day-1 - docker', name: 'docker', logs: [logs[0], logs[2]] },
      { id: 'day-1 - ', name: undefined, logs: [logs[1]] }
    ])
  })

  it('should put the group with the most recent first log first', () => {
    const olderGroupLog = buildLog({ groupName: 'old', date: '2026-01-02T08:00:00.000Z' })
    const newerGroupLog = buildLog({ groupName: 'new', date: '2026-01-02T10:00:00.000Z' })

    const result = groupLogsByGroup([olderGroupLog, newerGroupLog], 'day-1')

    expect(result.map(({ name }) => name)).toEqual(['new', 'old'])
  })
})

describe('groupLogsByJob', () => {
  it('should group consecutive logs of the same job and file only', () => {
    const logs = [
      buildLog({ id: 'a', jobId: 2, date: '2026-01-02T10:00:00.000Z' }),
      buildLog({ id: 'b', jobId: 2, date: '2026-01-02T09:59:00.000Z' }),
      buildLog({ id: 'c', jobId: 1, date: '2026-01-02T09:00:00.000Z' }),
      buildLog({ id: 'd', jobId: 2, fileName: 'other', date: '2026-01-02T08:00:00.000Z' }),
      buildLog({ id: 'e', jobId: 2, date: '2026-01-02T07:00:00.000Z' })
    ]

    const result = groupLogsByJob(logs)

    expect(result.map(({ id, logs: jobLogs }) => [id, jobLogs.length])).toEqual([
      ['0 - file - 2', 2],
      ['2 - file - 1', 1],
      ['3 - other - 2', 1],
      ['4 - file - 2', 1]
    ])
  })

  it('should return no job when there are no logs', () => {
    expect(groupLogsByJob([])).toEqual([])
  })
})

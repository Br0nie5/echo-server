import { createLogWithIds, type Log } from '@echo/utilities'
import { describe, expect, it } from 'vitest'

import { groupLogsByDay, groupLogsByGroup, groupLogsByJob } from '../groupLogs'

const buildLog = (overrides: Partial<Omit<Log, 'id' | 'contentId'>>): Log =>
  createLogWithIds(
    {
      date: '2026-01-02T10:00:00.000Z',
      jobId: 1,
      level: 'INFO',
      location: '/server/log/prune_images.jsonl',
      locationName: 'prune_images',
      message: 'message',
      origin: '/server/prune_images.sh:12',
      ...overrides
    },
    0
  )

describe('groupLogsByDay', () => {
  it('Should group the logs of the same day and put the most recent day first', () => {
    const newestLogs = [
      buildLog({ date: '2026-01-03T10:00:00.000Z' }),
      buildLog({ date: '2026-01-03T09:00:00.000Z' })
    ]
    const oldestLog = buildLog({ date: '2026-01-01T10:00:00.000Z' })

    const result = groupLogsByDay([...newestLogs, oldestLog])

    expect(result.map(({ logs }) => logs)).toEqual([newestLogs, [oldestLog]])
    expect(result[0].date.getHours()).toBe(12)
  })

  it('Should return no group when there are no logs', () => {
    expect(groupLogsByDay([])).toEqual([])
  })
})

describe('groupLogsByGroup', () => {
  it('Should group the logs by group name, keeping the logs without group apart', () => {
    const logs = [
      buildLog({ groupName: 'docker_utils', date: '2026-01-02T10:00:00.000Z' }),
      buildLog({ date: '2026-01-02T09:00:00.000Z' }),
      buildLog({ groupName: 'docker_utils', date: '2026-01-02T08:00:00.000Z' })
    ]

    const result = groupLogsByGroup(logs, 'day-1')

    expect(result).toEqual([
      { id: 'day-1 - docker_utils', name: 'docker_utils', logs: [logs[0], logs[2]] },
      { id: 'day-1 - ', name: undefined, logs: [logs[1]] }
    ])
  })

  it('Should put the group with the most recent first log first', () => {
    const olderGroupLog = buildLog({ groupName: 'backups', date: '2026-01-02T08:00:00.000Z' })
    const newerGroupLog = buildLog({ groupName: 'docker_utils', date: '2026-01-02T10:00:00.000Z' })

    const result = groupLogsByGroup([olderGroupLog, newerGroupLog], 'day-1')

    expect(result.map(({ name }) => name)).toEqual(['docker_utils', 'backups'])
  })
})

describe('groupLogsByJob', () => {
  it('Should group consecutive logs of the same job and file only', () => {
    const logs = [
      buildLog({ jobId: 2, date: '2026-01-02T10:00:00.000Z' }),
      buildLog({ jobId: 2, date: '2026-01-02T09:59:00.000Z' }),
      buildLog({ jobId: 1, date: '2026-01-02T09:00:00.000Z' }),
      buildLog({ jobId: 2, locationName: 'rotate_logs', date: '2026-01-02T08:00:00.000Z' }),
      buildLog({ jobId: 2, date: '2026-01-02T07:00:00.000Z' })
    ]

    const result = groupLogsByJob(logs)

    expect(result.map(({ id, logs: jobLogs }) => [id, jobLogs.length])).toEqual([
      ['0 - prune_images - 2', 2],
      ['2 - prune_images - 1', 1],
      ['3 - rotate_logs - 2', 1],
      ['4 - prune_images - 2', 1]
    ])
  })

  it('Should return no job when there are no logs', () => {
    expect(groupLogsByJob([])).toEqual([])
  })
})

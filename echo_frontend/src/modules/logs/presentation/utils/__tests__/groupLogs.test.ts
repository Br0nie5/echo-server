import { describe, expect, it } from 'vitest'

import { buildLog } from '../../../../../test/mocks/buildLog'
import { groupLogsByDay, groupLogsByGroup, groupLogsByJob } from '../groupLogs'

describe('groupLogsByDay', () => {
  it('Should return no group when there are no logs', () => {
    expect(groupLogsByDay([])).toEqual([])
  })
})

describe('groupLogsByGroup', () => {
  it('Should put the group with the most recent first log first', () => {
    const olderGroupLog = buildLog({ groupName: 'shop', date: '2026-01-02T08:00:00.000Z' })
    const newerGroupLog = buildLog({ groupName: 'billing', date: '2026-01-02T10:00:00.000Z' })

    const result = groupLogsByGroup([olderGroupLog, newerGroupLog], 'day-1')

    expect(result.map(({ name }) => name)).toEqual(['billing', 'shop'])
  })
})

describe('groupLogsByJob', () => {
  it('Should group the consecutive logs of the same job and location only', () => {
    const logs = [
      buildLog({ jobId: 2, date: '2026-01-02T10:00:00.000Z' }),
      buildLog({ jobId: 2, date: '2026-01-02T09:59:00.000Z' }),
      buildLog({ jobId: 1, date: '2026-01-02T09:00:00.000Z' }),
      buildLog({ jobId: 2, locationName: 'sync_stock', date: '2026-01-02T08:00:00.000Z' }),
      buildLog({ jobId: 2, date: '2026-01-02T07:00:00.000Z' })
    ]

    const result = groupLogsByJob(logs)

    expect(result.map(({ id, logs: jobLogs }) => [id, jobLogs.length])).toEqual([
      ['0 - send_invoices - 2', 2],
      ['2 - send_invoices - 1', 1],
      ['3 - sync_stock - 2', 1],
      ['4 - send_invoices - 2', 1]
    ])
  })

  it('Should return no job when there are no logs', () => {
    expect(groupLogsByJob([])).toEqual([])
  })
})

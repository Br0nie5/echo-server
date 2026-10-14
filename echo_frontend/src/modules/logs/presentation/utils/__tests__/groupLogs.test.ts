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

    const result = groupLogsByGroup([olderGroupLog, newerGroupLog])

    expect(result.map(({ name }) => name)).toEqual(['billing', 'shop'])
  })
})

describe('groupLogsByJob', () => {
  it('Should group the consecutive logs of the same job and location only, each job with the id of its first log', () => {
    const firstJobLog = buildLog({ jobId: 2, date: '2026-01-02T10:00:00.000Z' })
    const secondJobLog = buildLog({ jobId: 1, date: '2026-01-02T09:00:00.000Z' })
    const otherLocationJobLog = buildLog({
      jobId: 2,
      locationName: 'sync_stock',
      date: '2026-01-02T08:00:00.000Z'
    })
    const sameJobAgainLog = buildLog({ jobId: 2, date: '2026-01-02T07:00:00.000Z' })
    const logs = [
      firstJobLog,
      buildLog({ jobId: 2, date: '2026-01-02T09:59:00.000Z' }),
      secondJobLog,
      otherLocationJobLog,
      sameJobAgainLog
    ]

    const result = groupLogsByJob(logs)

    expect(result.map(({ id, logs: jobLogs }) => [id, jobLogs.length])).toEqual([
      [firstJobLog.id, 2],
      [secondJobLog.id, 1],
      [otherLocationJobLog.id, 1],
      [sameJobAgainLog.id, 1]
    ])
  })
})

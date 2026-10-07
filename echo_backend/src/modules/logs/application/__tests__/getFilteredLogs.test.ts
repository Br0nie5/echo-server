import { LogCategory as LogCategoryConst, type Log } from '@echo/utilities'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { getFilteredLogs } from '../getFilteredLogs.js'

describe('getFilteredLogs', () => {
  const mockFindAllLogs = vi.fn()
  const repository = { findAllLogs: mockFindAllLogs }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return only the logs logged since fromDate', async () => {
    const now = new Date()
    const oldDate = new Date(now.getTime() - 1000 * 60 * 60) // 1 hour ago
    const recentDate = new Date(now.getTime() - 1000 * 60) // 1 min ago

    const log1: Log = {
      date: oldDate.toISOString(),
      jobId: 1,
      category: 'INFO',
      fileName: 'f',
      id: '1',
      message: 'old log',
      groupName: 'grp',
      callFile: 'f.sh',
      callLine: 1
    }
    const log2: Log = {
      date: recentDate.toISOString(),
      jobId: 2,
      category: 'ERROR',
      fileName: 'f',
      id: '2',
      message: 'recent log',
      groupName: 'grp',
      callFile: 'f.sh',
      callLine: 2
    }

    mockFindAllLogs.mockResolvedValue([log1, log2])

    const fromDate = new Date(now.getTime() - 30 * 60 * 1000) // only logs newer than 30 minutes
    const result = await getFilteredLogs(repository, {
      fromDate,
      categories: ['INFO', 'ERROR'],
      searchFilters: []
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toBe(log2)
  })

  it('should return the logs from the newest to the oldest, whatever the order of the repository', async () => {
    const now = new Date()
    const logAt = (jobId: number, millisecondsAgo: number): Log =>
      ({
        date: new Date(now.getTime() - millisecondsAgo).toISOString(),
        jobId,
        category: 'INFO',
        fileName: 'f',
        id: String(jobId),
        message: `log${jobId}`,
        groupName: 'grp'
      }) as Log

    mockFindAllLogs.mockResolvedValue([logAt(2, 2000), logAt(1, 3000), logAt(3, 1000)])

    const fromDate = new Date(now.getTime() - 10000) // all logs
    const result = await getFilteredLogs(repository, {
      fromDate,
      categories: ['INFO'],
      searchFilters: []
    })

    expect(result.map((log) => log.jobId)).toEqual([3, 2, 1])
  })

  it('should return an empty array if no logs after fromDate', async () => {
    const oldDate = new Date(Date.now() - 1000 * 60 * 60) // 1h ago
    const log = {
      date: oldDate.toISOString(),
      jobId: 1,
      category: 'INFO',
      fileName: 'f',
      id: '1',
      message: 'old',
      groupName: 'grp'
    }

    mockFindAllLogs.mockResolvedValue([log] as Log[])

    const fromDate = new Date() // now
    const result = await getFilteredLogs(repository, {
      fromDate,
      categories: ['INFO'],
      searchFilters: [{ mode: 'find', search: 'old' }]
    })

    expect(result).toEqual([])
  })
  it('should return an empty array if no logs', async () => {
    mockFindAllLogs.mockResolvedValue([])

    const fromDate = new Date() // now
    const result = await getFilteredLogs(repository, {
      fromDate,
      categories: Object.values(LogCategoryConst),
      searchFilters: [{ mode: 'find', search: 'file1' }]
    })

    expect(result).toEqual([])
  })
})

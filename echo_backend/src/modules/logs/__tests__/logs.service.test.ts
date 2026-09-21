import { LogCategory as LogCategoryConst, type Log } from '@echo/utilities'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { createLogsService } from '../logs.service.js'

describe('LogsService.getAllLastLogs', () => {
  const mockFindAll = vi.fn()
  const LogsService = createLogsService({ findAll: mockFindAll })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return sorted logs filtered by fromDate', async () => {
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
      groupName: 'grp'
    }
    const log2: Log = {
      date: recentDate.toISOString(),
      jobId: 2,
      category: 'ERROR',
      fileName: 'f',
      id: '2',
      message: 'recent log',
      groupName: 'grp'
    }

    mockFindAll.mockResolvedValue([log1, log2])

    const fromDate = new Date(now.getTime() - 30 * 60 * 1000) // only logs newer than 30 minutes
    const result = await LogsService.getAllLastLogs({
      fromDate,
      categories: ['INFO', 'ERROR'],
      searchFilters: []
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toBe(log2)
  })

  it('should return logs sorted in reverse order', async () => {
    const now = new Date()
    const log1 = {
      date: now.toISOString(),
      jobId: 1,
      category: 'INFO',
      fileName: 'f',
      id: '1',
      message: 'log1',
      groupName: 'grp'
    }
    const log2 = {
      date: now.toISOString(),
      jobId: 2,
      category: 'ERROR',
      fileName: 'f',
      id: '2',
      message: 'log2',
      groupName: 'grp'
    }

    mockFindAll.mockResolvedValue([log1, log2] as Log[])

    const fromDate = new Date(now.getTime() - 10000) // all logs
    const result = await LogsService.getAllLastLogs({
      fromDate,
      categories: ['INFO', 'ERROR'],
      searchFilters: []
    })

    expect(result[0].jobId).toBe(2) // newest first
    expect(result[1].jobId).toBe(1)
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

    mockFindAll.mockResolvedValue([log] as Log[])

    const fromDate = new Date() // now
    const result = await LogsService.getAllLastLogs({
      fromDate,
      categories: ['INFO'],
      searchFilters: [{ mode: 'find', search: 'old' }]
    })

    expect(result).toEqual([])
  })
  it('should return an empty array if no logs', async () => {
    mockFindAll.mockResolvedValue([])

    const fromDate = new Date() // now
    const result = await LogsService.getAllLastLogs({
      fromDate,
      categories: Object.values(LogCategoryConst),
      searchFilters: [{ mode: 'find', search: 'file1' }]
    })

    expect(result).toEqual([])
  })
})

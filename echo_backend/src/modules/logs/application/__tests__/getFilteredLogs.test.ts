import { LogCategory as LogCategoryConst, type Log } from '@echo/utilities'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { SelfReport } from '../../../selfReport/domain/selfReport.js'
import { getFilteredLogs } from '../getFilteredLogs.js'

describe('getFilteredLogs', () => {
  const mockFindAllLogs = vi.fn()
  const repository = {
    getAllLogs: mockFindAllLogs,
    getLogs: vi.fn(),
    saveLogs: vi.fn(),
    deleteLogs: vi.fn()
  }
  const selfReportRepository = { saveSelfReports: vi.fn() }

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
      location: '/logs/f.jsonl',
      locationName: 'f',
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
      location: '/logs/f.jsonl',
      locationName: 'f',
      id: '2',
      message: 'recent log',
      groupName: 'grp',
      callFile: 'f.sh',
      callLine: 2
    }

    mockFindAllLogs.mockResolvedValue({ logs: [log1, log2], selfReports: [] })

    const fromDate = new Date(now.getTime() - 30 * 60 * 1000) // only logs newer than 30 minutes
    const result = await getFilteredLogs(repository, selfReportRepository, {
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
        location: '/logs/f.jsonl',
        locationName: 'f',
        id: String(jobId),
        message: `log${jobId}`,
        groupName: 'grp'
      }) as Log

    mockFindAllLogs.mockResolvedValue({
      logs: [logAt(2, 2000), logAt(1, 3000), logAt(3, 1000)],
      selfReports: []
    })

    const fromDate = new Date(now.getTime() - 10000) // all logs
    const result = await getFilteredLogs(repository, selfReportRepository, {
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
      location: '/logs/f.jsonl',
      locationName: 'f',
      id: '1',
      message: 'old',
      groupName: 'grp'
    }

    mockFindAllLogs.mockResolvedValue({ logs: [log] as Log[], selfReports: [] })

    const fromDate = new Date() // now
    const result = await getFilteredLogs(repository, selfReportRepository, {
      fromDate,
      categories: ['INFO'],
      searchFilters: [{ mode: 'find', search: 'old' }]
    })

    expect(result).toEqual([])
  })
  it('should return an empty array if no logs', async () => {
    mockFindAllLogs.mockResolvedValue({ logs: [], selfReports: [] })

    const fromDate = new Date() // now
    const result = await getFilteredLogs(repository, selfReportRepository, {
      fromDate,
      categories: Object.values(LogCategoryConst),
      searchFilters: [{ mode: 'find', search: 'file1' }]
    })

    expect(result).toEqual([])
  })

  it('should save the self reports of the repository in a single save', async () => {
    const selfReports: SelfReport[] = [
      {
        date: new Date('2026-09-19T14:41:09.669Z'),
        message: 'invalid line',
        level: 'warning',
        reportedFile: 'a',
        reportedLine: 2
      },
      {
        date: new Date('2026-09-19T14:41:09.669Z'),
        message: 'cut line',
        level: 'warning',
        reportedFile: 'b',
        reportedLine: 1
      }
    ]
    mockFindAllLogs.mockResolvedValue({ logs: [], selfReports })

    await getFilteredLogs(repository, selfReportRepository, {
      fromDate: new Date(),
      categories: [],
      searchFilters: []
    })

    expect(selfReportRepository.saveSelfReports).toHaveBeenCalledExactlyOnceWith(selfReports)
  })
})

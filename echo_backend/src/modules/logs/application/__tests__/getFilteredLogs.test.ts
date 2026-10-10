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

  it('should return only the logs logged since fromDate, fromDate included', async () => {
    const createLog = (id: string, date: string): Log => ({
      date,
      jobId: 1,
      category: 'INFO',
      location: '/logs/f.jsonl',
      locationName: 'f',
      id,
      message: id,
      groupName: 'grp',
      callFile: 'f.sh',
      callLine: 1
    })
    const fromDateLog = createLog('at fromDate', '2026-01-01T10:00:00.000Z')
    const afterFromDateLog = createLog('after fromDate', '2026-01-01T10:30:00.000Z')
    mockFindAllLogs.mockResolvedValue({
      logs: [
        createLog('before fromDate', '2026-01-01T09:59:59.999Z'),
        fromDateLog,
        afterFromDateLog
      ],
      selfReports: []
    })

    const result = await getFilteredLogs(repository, selfReportRepository, {
      fromDate: new Date('2026-01-01T10:00:00.000Z'),
      categories: [],
      searchFilters: []
    })

    expect(result).toEqual([afterFromDateLog, fromDateLog])
  })

  it('should return only the logs logged before toDate, toDate left out', async () => {
    const createLog = (id: string, date: string): Log => ({
      date,
      jobId: 1,
      category: 'ERROR',
      location: '/logs/f.jsonl',
      locationName: 'f',
      id,
      message: id,
      callFile: 'f.sh',
      callLine: 1
    })
    const fromDateLog = createLog('fromDate', '2026-01-01T10:00:00.000Z')
    const beforeToDateLog = createLog('before toDate', '2026-01-01T10:29:59.999Z')
    mockFindAllLogs.mockResolvedValue({
      logs: [fromDateLog, beforeToDateLog, createLog('toDate', '2026-01-01T10:30:00.000Z')],
      selfReports: []
    })

    const result = await getFilteredLogs(repository, selfReportRepository, {
      fromDate: new Date('2026-01-01T10:00:00.000Z'),
      toDate: new Date('2026-01-01T10:30:00.000Z'),
      categories: [],
      searchFilters: []
    })

    expect(result).toEqual([beforeToDateLog, fromDateLog])
  })

  it('should return the logs from the newest to the oldest, whatever the order of the repository', async () => {
    const logAt = (jobId: number, date: string): Log =>
      ({
        date,
        jobId,
        category: 'INFO',
        location: '/logs/f.jsonl',
        locationName: 'f',
        id: String(jobId),
        message: `log${jobId}`,
        groupName: 'grp'
      }) as Log

    mockFindAllLogs.mockResolvedValue({
      logs: [
        logAt(2, '2026-01-01T10:00:02.000Z'),
        logAt(1, '2026-01-01T10:00:01.000Z'),
        logAt(3, '2026-01-01T10:00:03.000Z')
      ],
      selfReports: []
    })

    const result = await getFilteredLogs(repository, selfReportRepository, {
      fromDate: new Date('2026-01-01T10:00:00.000Z'),
      categories: ['INFO'],
      searchFilters: []
    })

    expect(result.map((log) => log.jobId)).toEqual([3, 2, 1])
  })

  it('should return an empty array if no logs after fromDate', async () => {
    const log = {
      date: '2026-01-01T09:00:00.000Z',
      jobId: 1,
      category: 'INFO',
      location: '/logs/f.jsonl',
      locationName: 'f',
      id: '1',
      message: 'old',
      groupName: 'grp'
    }

    mockFindAllLogs.mockResolvedValue({ logs: [log] as Log[], selfReports: [] })

    const result = await getFilteredLogs(repository, selfReportRepository, {
      fromDate: new Date('2026-01-01T10:00:00.000Z'),
      categories: ['INFO'],
      searchFilters: [{ mode: 'find', search: 'old' }]
    })

    expect(result).toEqual([])
  })

  it('should return an empty array if no logs', async () => {
    mockFindAllLogs.mockResolvedValue({ logs: [], selfReports: [] })

    const result = await getFilteredLogs(repository, selfReportRepository, {
      fromDate: new Date('2026-01-01T10:00:00.000Z'),
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
      fromDate: new Date('2026-01-01T10:00:00.000Z'),
      categories: [],
      searchFilters: []
    })

    expect(selfReportRepository.saveSelfReports).toHaveBeenCalledExactlyOnceWith(selfReports)
  })
})

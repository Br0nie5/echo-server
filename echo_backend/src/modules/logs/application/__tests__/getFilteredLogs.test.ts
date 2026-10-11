import { createLogWithIds, LogCategory as LogCategoryConst, type Log } from '@echo/utilities'
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

  it('Should return only the logs logged since fromDate, fromDate included', async () => {
    const createLog = (message: string, date: string): Log =>
      createLogWithIds(
        {
          date,
          jobId: 1,
          category: 'INFO',
          location: '/server/docker_utils/log/prune_images.jsonl',
          locationName: 'prune_images',
          message,
          groupName: 'docker_utils',
          origin: '/server/docker_utils/prune_images.sh:12'
        },
        0
      )
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

  it('Should return only the logs logged before toDate, toDate left out', async () => {
    const createLog = (message: string, date: string): Log =>
      createLogWithIds(
        {
          date,
          jobId: 1,
          category: 'ERROR',
          location: '/server/log/prune_images.jsonl',
          locationName: 'prune_images',
          message,
          origin: '/server/prune_images.sh:12'
        },
        0
      )
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

  it('Should return the logs from the newest to the oldest, whatever the order of the repository', async () => {
    const logAt = (jobId: number, date: string): Log =>
      createLogWithIds(
        {
          date,
          jobId,
          category: 'INFO',
          location: '/server/docker_utils/log/prune_images.jsonl',
          locationName: 'prune_images',
          message: `log${jobId}`,
          groupName: 'docker_utils',
          origin: '/server/docker_utils/prune_images.sh:12'
        },
        0
      )

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

  it('Should return an empty array if no logs after fromDate', async () => {
    const log = createLogWithIds(
      {
        date: '2026-01-01T09:00:00.000Z',
        jobId: 1,
        category: 'INFO',
        location: '/server/docker_utils/log/prune_images.jsonl',
        locationName: 'prune_images',
        message: 'old',
        groupName: 'docker_utils',
        origin: '/server/docker_utils/prune_images.sh:12'
      },
      0
    )

    mockFindAllLogs.mockResolvedValue({ logs: [log], selfReports: [] })

    const result = await getFilteredLogs(repository, selfReportRepository, {
      fromDate: new Date('2026-01-01T10:00:00.000Z'),
      categories: ['INFO'],
      searchFilters: [{ mode: 'find', search: 'old' }]
    })

    expect(result).toEqual([])
  })

  it('Should return an empty array if no logs', async () => {
    mockFindAllLogs.mockResolvedValue({ logs: [], selfReports: [] })

    const result = await getFilteredLogs(repository, selfReportRepository, {
      fromDate: new Date('2026-01-01T10:00:00.000Z'),
      categories: Object.values(LogCategoryConst),
      searchFilters: [{ mode: 'find', search: 'prune_images' }]
    })

    expect(result).toEqual([])
  })

  it('Should save the self reports of the repository in a single save', async () => {
    const selfReports: SelfReport[] = [
      {
        id: '2026-09-19T14:41:09.669Z invalid line WARNING /server/docker_utils/log/prune_images.jsonl:2',
        date: new Date('2026-09-19T14:41:09.669Z'),
        message: 'invalid line',
        level: 'WARNING',
        origin: '/server/docker_utils/log/prune_images.jsonl:2'
      },
      {
        id: '2026-09-19T14:41:09.669Z cut line WARNING /server/log/rotate_logs.jsonl:1',
        date: new Date('2026-09-19T14:41:09.669Z'),
        message: 'cut line',
        level: 'WARNING',
        origin: '/server/log/rotate_logs.jsonl:1'
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

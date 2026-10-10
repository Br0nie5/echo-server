import type { Log } from '@echo/utilities'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockSelfReportsConfig } from '../../../../test/mocks/mockConfigs.js'
import type { SelfReport } from '../../domain/selfReport.js'
import { createSelfLogReportRepository } from '../selfLogReport.repository.js'

const SELF_REPORTS_LOCATION = '/server_logs/self_reports/Echo/log/parseLogFile.jsonl'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const logger = { error: vi.fn() }

const logsRepository = {
  getAllLogs: vi.fn(),
  getLogs: vi.fn(),
  saveLogs: vi.fn(),
  deleteLogs: vi.fn()
}

const sessionJobIdApi = {
  getLastSessionJobId: vi.fn(),
  saveLastSessionJobId: vi.fn()
}

const options = {
  logsRepository,
  sessionJobIdApi,
  selfReportsConfig: getMockSelfReportsConfig({ retentionDays: 10, selfReportsGroupName: 'Echo' }),
  selfReportsLocation: SELF_REPORTS_LOCATION,
  selfReportsLocationName: 'parseLogFile',
  logger
}

const selfReport = (overrides: Partial<SelfReport> = {}): SelfReport => ({
  date: new Date('2026-09-19T14:41:09.669Z'),
  message: 'bad line',
  level: 'warning',
  reportedFile: 'someFile',
  reportedLine: 3,
  ...overrides
})

/** When the repository is created: the retention is counted back from it. */
const NOW = new Date('2026-10-01T00:00:00.000Z')

const daysAgo = (days: number): string =>
  new Date(NOW.getTime() - days * MILLISECONDS_PER_DAY).toISOString()

/** A log stored at the location, a day ago unless `overrides` says otherwise. */
const storedLog = (overrides: Partial<Log> = {}): Log => ({
  id: 'stored',
  location: SELF_REPORTS_LOCATION,
  locationName: 'parseLogFile',
  groupName: 'Echo',
  date: daysAgo(1),
  jobId: 1,
  category: 'WARNING',
  message: 'bad line',
  callFile: 'someFile',
  callLine: 3,
  ...overrides
})

const mockStoredLogs = (logs: Log[]): void => {
  logsRepository.getLogs.mockResolvedValueOnce({ logs, selfReports: [] })
}

const lastSavedLogs = (): Log[] => logsRepository.saveLogs.mock.lastCall?.[0] as Log[]

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  sessionJobIdApi.getLastSessionJobId.mockResolvedValue(4)
  sessionJobIdApi.saveLastSessionJobId.mockResolvedValue(undefined)
  logsRepository.getLogs.mockResolvedValue({ logs: [], selfReports: [] })
  logsRepository.saveLogs.mockResolvedValue(undefined)
  logsRepository.deleteLogs.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createSelfLogReportRepository', () => {
  it('should save the last session jobId plus one as its session jobId', async () => {
    await createSelfLogReportRepository(options)

    expect(sessionJobIdApi.saveLastSessionJobId).toHaveBeenCalledTimes(1)
    expect(sessionJobIdApi.saveLastSessionJobId).toHaveBeenCalledWith(5)
  })

  it('should take 1 as its session jobId when there is no last session jobId', async () => {
    sessionJobIdApi.getLastSessionJobId.mockRejectedValueOnce(new Error('ENOENT'))

    const selfReportRepository = await createSelfLogReportRepository(options)
    await selfReportRepository.saveSelfReports([selfReport()])

    expect(sessionJobIdApi.saveLastSessionJobId).toHaveBeenCalledWith(1)
    expect(lastSavedLogs()[0].jobId).toBe(1)
  })

  it('should save its location again without the logs older than retentionDays', async () => {
    const recentLog = storedLog({ date: daysAgo(1) })
    mockStoredLogs([storedLog({ date: daysAgo(20) }), recentLog])

    await createSelfLogReportRepository(options)

    expect(logsRepository.getLogs).toHaveBeenCalledWith(SELF_REPORTS_LOCATION)
    expect(logsRepository.saveLogs).toHaveBeenCalledExactlyOnceWith([recentLog])
    expect(logsRepository.deleteLogs).not.toHaveBeenCalled()
  })

  it('should keep a log exactly retentionDays old, and leave out one a millisecond older', async () => {
    const retentionLimitLog = storedLog({ date: '2026-09-21T00:00:00.000Z' })
    mockStoredLogs([storedLog({ date: '2026-09-20T23:59:59.999Z' }), retentionLimitLog])

    await createSelfLogReportRepository(options)

    expect(logsRepository.saveLogs).toHaveBeenCalledExactlyOnceWith([retentionLimitLog])
  })

  it('should delete the logs of its location when they are all older than retentionDays', async () => {
    mockStoredLogs([storedLog({ date: daysAgo(20) })])

    await createSelfLogReportRepository(options)

    expect(logsRepository.deleteLogs).toHaveBeenCalledExactlyOnceWith(SELF_REPORTS_LOCATION)
    expect(logsRepository.saveLogs).not.toHaveBeenCalled()
  })

  it('should delete the logs of its location even when nothing is stored there yet, to know it can be written', async () => {
    await createSelfLogReportRepository(options)

    expect(logsRepository.deleteLogs).toHaveBeenCalledExactlyOnceWith(SELF_REPORTS_LOCATION)
  })

  it('should save its session jobId once its location is saved', async () => {
    const steps: string[] = []
    logsRepository.deleteLogs.mockImplementationOnce(async () => {
      steps.push('storeLogs')
    })
    sessionJobIdApi.saveLastSessionJobId.mockImplementationOnce(async () => {
      steps.push('saveSessionJobId')
    })

    await createSelfLogReportRepository(options)

    expect(steps).toEqual(['storeLogs', 'saveSessionJobId'])
  })

  it.each([
    [
      'its location cannot be read',
      (): unknown => logsRepository.getLogs.mockRejectedValueOnce(new Error('EACCES'))
    ],
    [
      'its location cannot be written',
      (): unknown => logsRepository.deleteLogs.mockRejectedValueOnce(new Error('EACCES'))
    ]
  ])('should not save its session jobId when %s', async (_, failSetup) => {
    failSetup()

    await createSelfLogReportRepository(options)

    expect(sessionJobIdApi.saveLastSessionJobId).not.toHaveBeenCalled()
  })

  it.each([
    [
      'its location cannot be read',
      (): unknown => logsRepository.getLogs.mockRejectedValueOnce(new Error('EACCES'))
    ],
    [
      'its location cannot be written',
      (): unknown => logsRepository.deleteLogs.mockRejectedValueOnce(new Error('EACCES'))
    ],
    [
      'the session jobId cannot be saved',
      (): unknown => sessionJobIdApi.saveLastSessionJobId.mockRejectedValueOnce(new Error('EACCES'))
    ]
  ])(
    'should fall back to a repository that stores nothing and log the error when %s',
    async (_, failSetup) => {
      failSetup()

      const selfReportRepository = await createSelfLogReportRepository(options)

      expect(logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error), selfReportsLocation: SELF_REPORTS_LOCATION },
        'Failed to set up self reports, disabling them for this session'
      )

      logsRepository.saveLogs.mockClear()
      await selfReportRepository.saveSelfReports([selfReport()])
      expect(logsRepository.saveLogs).not.toHaveBeenCalled()
    }
  )

  describe('saveSelfReports', () => {
    it('should do nothing when there is no self report', async () => {
      const selfReportRepository = await createSelfLogReportRepository(options)
      vi.clearAllMocks()

      await selfReportRepository.saveSelfReports([])

      expect(logsRepository.getLogs).not.toHaveBeenCalled()
      expect(logsRepository.saveLogs).not.toHaveBeenCalled()
    })

    it('should store one log per self report after the stored ones, with the session job and its own date', async () => {
      const selfReportRepository = await createSelfLogReportRepository(options)
      const alreadyStoredLog = storedLog({ message: 'other' })
      mockStoredLogs([alreadyStoredLog])

      await selfReportRepository.saveSelfReports([
        selfReport({ message: 'bad line 1', reportedLine: 1 }),
        selfReport({
          date: new Date('2026-09-20T08:00:00.000Z'),
          message: 'bad line 2',
          level: 'error',
          reportedLine: undefined
        })
      ])

      const whereItIsStored = {
        id: expect.any(String),
        location: SELF_REPORTS_LOCATION,
        locationName: 'parseLogFile',
        groupName: 'Echo'
      }
      expect(logsRepository.saveLogs).toHaveBeenLastCalledWith([
        alreadyStoredLog,
        {
          ...whereItIsStored,
          date: '2026-09-19T14:41:09.669Z',
          jobId: 5,
          category: 'WARNING',
          message: 'bad line 1',
          callFile: 'someFile',
          callLine: 1
        },
        {
          ...whereItIsStored,
          date: '2026-09-20T08:00:00.000Z',
          jobId: 5,
          category: 'ERROR',
          message: 'bad line 2',
          callFile: 'someFile',
          callLine: 0
        }
      ])
    })

    it('should leave out the stored logs with the same file, line and message as a self report', async () => {
      const selfReportRepository = await createSelfLogReportRepository(options)
      const otherMessageLog = storedLog({ message: 'other' })
      const otherLineLog = storedLog({ callLine: 9 })
      const otherFileLog = storedLog({ callFile: 'otherFile' })
      mockStoredLogs([
        storedLog(),
        otherMessageLog,
        storedLog({ jobId: 2, category: 'ERROR', date: daysAgo(30) }),
        otherLineLog,
        otherFileLog,
        storedLog({ message: 'second', callLine: 7 }),
        storedLog({ message: 'without line', callLine: 0 })
      ])

      await selfReportRepository.saveSelfReports([
        selfReport(),
        selfReport({ message: 'second', reportedLine: 7 }),
        selfReport({ message: 'without line', reportedLine: undefined })
      ])

      expect(lastSavedLogs().slice(0, 3)).toEqual([otherMessageLog, otherLineLog, otherFileLog])
      expect(lastSavedLogs()).toHaveLength(6)
    })

    it.each([
      [
        'its location cannot be read',
        (): unknown => logsRepository.getLogs.mockRejectedValueOnce(new Error('EACCES'))
      ],
      [
        'its location cannot be written',
        (): unknown => logsRepository.saveLogs.mockRejectedValueOnce(new Error('EACCES'))
      ]
    ])(
      'should log the error and not throw when %s, and still run the next save',
      async (_, failSave) => {
        const selfReportRepository = await createSelfLogReportRepository(options)
        logsRepository.saveLogs.mockClear()
        failSave()

        await expect(selfReportRepository.saveSelfReports([selfReport()])).resolves.toBeUndefined()

        expect(logger.error).toHaveBeenCalledWith(
          { err: expect.any(Error), selfReportsLocation: SELF_REPORTS_LOCATION },
          'Failed to write self reports'
        )

        logsRepository.saveLogs.mockClear()
        await selfReportRepository.saveSelfReports([selfReport()])
        expect(logsRepository.saveLogs).toHaveBeenCalledTimes(1)
      }
    )
  })
})

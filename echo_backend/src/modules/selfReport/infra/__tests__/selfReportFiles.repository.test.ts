import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../sessionIdFile.api.js')
vi.mock('../selfReportsFiles.api.js')

import { getMockSelfReportsConfig } from '../../../../test/mocks/mockConfigs.js'
import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import type { SelfReport } from '../../domain/selfReport.js'
import type { SelfReportRepository } from '../../domain/selfReport.repository.js'
import { createSelfReportFilesRepository } from '../selfReportFiles.repository.js'
import { createSelfReportsFilesApi as actualCreateSelfReportsFilesApi } from '../selfReportsFiles.api.js'
import { createSessionIdFileApi as actualCreateSessionIdFileApi } from '../sessionIdFile.api.js'

const createSessionIdFileApi = vi.mocked(actualCreateSessionIdFileApi)
const createSelfReportsFilesApi = vi.mocked(actualCreateSelfReportsFilesApi)

const SELF_REPORTS_FILE_PATH = '/self_reports/Echo/parseLogFile.jsonl'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const logger = { error: vi.fn() }
const filesService = getMockFilesService()

const selfReportsFilesApi = {
  getAllSelfReportFilesPaths: vi.fn(),
  getSelfReportFilePathFromRoot: vi.fn(),
  getSelfReportLines: vi.fn(),
  saveSelfReportLines: vi.fn()
}

const sessionIdApi = {
  getLastSessionId: vi.fn(),
  saveLastSessionId: vi.fn()
}

const selfReportsConfig = getMockSelfReportsConfig({
  retentionDays: 10,
  selfReportsDirPath: '/self_reports/Echo',
  parseLogsSelfReportFileName: 'parseLogFile.jsonl',
  parseLogsSessionFilePath: '/fake/data/logs_self_reports_session.json'
})

const options = {
  filesService,
  selfReportsConfig,
  getSelfReportFileName: ({
    parseLogsSelfReportFileName
  }: {
    parseLogsSelfReportFileName: string
  }): string => parseLogsSelfReportFileName,
  getSessionFilePath: ({
    parseLogsSessionFilePath
  }: {
    parseLogsSessionFilePath: string
  }): string => parseLogsSessionFilePath,
  logger
}

/** Creates the repository of `options`, whose set up the tests of its methods do not make fail. */
const createRepository = async (): Promise<SelfReportRepository> =>
  (await createSelfReportFilesRepository(options))!

/** A self report to save, which the repository stores with its session, the 5, unless `overrides` says otherwise. */
const selfReport = (overrides: Partial<SelfReport> = {}): SelfReport => ({
  date: new Date('2026-10-01T08:00:00.000Z'),
  message: 'bad line',
  level: 'WARNING',
  origin: '/server/billing/logs/send_invoices.jsonl:3',
  ...overrides
})

/** When the repository is created: the retention is counted back from it. */
const NOW = new Date('2026-10-01T00:00:00.000Z')

const daysAgo = (days: number): string =>
  new Date(NOW.getTime() - days * MILLISECONDS_PER_DAY).toISOString()

/** A line of a self-report file, reported a day ago during the session 1 unless `overrides` says otherwise. */
const storedLine = (
  overrides: Partial<{
    sessionId: number
    date: string
    level: string
    message: string
    origin: string
  }> = {}
): string =>
  JSON.stringify({
    sessionId: 1,
    date: daysAgo(1),
    level: 'WARNING',
    message: 'bad line',
    origin: '/server/billing/logs/send_invoices.jsonl:3',
    ...overrides
  })

const lastSavedLines = (): string[] =>
  selfReportsFilesApi.saveSelfReportLines.mock.lastCall?.[1] as string[]

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  createSelfReportsFilesApi.mockReturnValue(selfReportsFilesApi)
  createSessionIdFileApi.mockReturnValue(sessionIdApi)
  sessionIdApi.getLastSessionId.mockResolvedValue(4)
  sessionIdApi.saveLastSessionId.mockResolvedValue(undefined)
  selfReportsFilesApi.getSelfReportFilePathFromRoot.mockImplementation((filePath: string) =>
    filePath.slice(1)
  )
  selfReportsFilesApi.getSelfReportLines.mockResolvedValue([])
  selfReportsFilesApi.saveSelfReportLines.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

// Saving a self report and reading it back are tested through the server (`logs.routes.test.ts`,
// `logs.notifier.test.ts`). Here is what no request reaches: the retention, the self
// reports stored after the ones already there, several self-report files, and the storage failing.
describe('createSelfReportFilesRepository', () => {
  it('Should read and write its files through the files service, with the self reports config', async () => {
    await createSelfReportFilesRepository(options)

    expect(createSelfReportsFilesApi).toHaveBeenCalledExactlyOnceWith(
      selfReportsConfig,
      filesService
    )
    expect(createSessionIdFileApi).toHaveBeenCalledExactlyOnceWith(
      '/fake/data/logs_self_reports_session.json',
      filesService
    )
  })

  it('Should create no repository when there is no self reports config', async () => {
    const selfReportRepository = await createSelfReportFilesRepository({
      ...options,
      selfReportsConfig: undefined
    })

    expect(selfReportRepository).toBeUndefined()
    expect(createSelfReportsFilesApi).not.toHaveBeenCalled()
  })

  it('Should write its file again without the self reports older than retentionDays, nor the lines that hold none', async () => {
    const retentionLimitLine = storedLine({ date: '2026-09-21T00:00:00.000Z' })
    const recentLine = storedLine({ date: daysAgo(1) })
    selfReportsFilesApi.getSelfReportLines.mockResolvedValueOnce([
      storedLine({ date: daysAgo(20) }),
      storedLine({ date: '2026-09-20T23:59:59.999Z' }),
      retentionLimitLine,
      'not a self report',
      recentLine
    ])

    await createSelfReportFilesRepository(options)

    expect(selfReportsFilesApi.getSelfReportLines).toHaveBeenCalledWith(SELF_REPORTS_FILE_PATH)
    expect(selfReportsFilesApi.saveSelfReportLines).toHaveBeenCalledExactlyOnceWith(
      SELF_REPORTS_FILE_PATH,
      [retentionLimitLine, recentLine]
    )
  })

  it('Should save the last session id plus one, once its file is written', async () => {
    const steps: string[] = []
    selfReportsFilesApi.saveSelfReportLines.mockImplementationOnce(async () => {
      steps.push('saveSelfReportLines')
    })
    sessionIdApi.saveLastSessionId.mockImplementationOnce(async () => {
      steps.push('saveLastSessionId')
    })

    await createSelfReportFilesRepository(options)

    expect(sessionIdApi.saveLastSessionId).toHaveBeenCalledExactlyOnceWith(5)
    expect(steps).toEqual(['saveSelfReportLines', 'saveLastSessionId'])
  })

  it.each([
    [
      'its file cannot be read',
      (): unknown =>
        selfReportsFilesApi.getSelfReportLines.mockRejectedValueOnce(new Error('EACCES'))
    ],
    [
      'its file cannot be written',
      (): unknown =>
        selfReportsFilesApi.saveSelfReportLines.mockRejectedValueOnce(new Error('EACCES'))
    ]
  ])('Should not save its session id when %s', async (_, failSetup) => {
    failSetup()

    await createSelfReportFilesRepository(options)

    expect(sessionIdApi.saveLastSessionId).not.toHaveBeenCalled()
  })

  it.each([
    [
      'its file cannot be read',
      (): unknown =>
        selfReportsFilesApi.getSelfReportLines.mockRejectedValueOnce(new Error('EACCES'))
    ],
    [
      'its file cannot be written',
      (): unknown =>
        selfReportsFilesApi.saveSelfReportLines.mockRejectedValueOnce(new Error('EACCES'))
    ],
    [
      'the session id cannot be saved',
      (): unknown => sessionIdApi.saveLastSessionId.mockRejectedValueOnce(new Error('EACCES'))
    ]
  ])('Should create no repository and log the error when %s', async (_, failSetup) => {
    failSetup()

    const selfReportRepository = await createSelfReportFilesRepository(options)

    expect(selfReportRepository).toBeUndefined()
    expect(logger.error).toHaveBeenCalledWith(
      { err: expect.any(Error), selfReportsFilePath: SELF_REPORTS_FILE_PATH },
      'Failed to set up self reports, disabling them for this session'
    )
  })

  describe('saveSelfReports', () => {
    it('Should do nothing when there is no self report', async () => {
      const selfReportRepository = await createRepository()
      vi.clearAllMocks()

      await selfReportRepository.saveSelfReports([])

      expect(selfReportsFilesApi.getSelfReportLines).not.toHaveBeenCalled()
      expect(selfReportsFilesApi.saveSelfReportLines).not.toHaveBeenCalled()
    })

    it('Should store the self reports after the stored ones, in the order they are given, whatever their dates', async () => {
      const selfReportRepository = await createRepository()
      const storedTodayLine = storedLine({ date: daysAgo(0), message: 'stored today' })
      const storedTwoDaysAgoLine = storedLine({ date: daysAgo(2), message: 'stored two days ago' })
      selfReportsFilesApi.getSelfReportLines.mockResolvedValueOnce([
        storedTodayLine,
        'not a self report',
        storedTwoDaysAgoLine
      ])

      await selfReportRepository.saveSelfReports([
        selfReport({ date: new Date(daysAgo(0)), message: 'reported now' }),
        selfReport({ date: new Date(daysAgo(3)), message: 'reported three days ago' })
      ])

      expect(selfReportsFilesApi.saveSelfReportLines).toHaveBeenLastCalledWith(
        SELF_REPORTS_FILE_PATH,
        [
          storedTodayLine,
          storedTwoDaysAgoLine,
          storedLine({ sessionId: 5, date: daysAgo(0), message: 'reported now' }),
          storedLine({ sessionId: 5, date: daysAgo(3), message: 'reported three days ago' })
        ]
      )
    })

    it('Should leave out the self reports with the level, the message and the origin of a stored one, or of one given before', async () => {
      const selfReportRepository = await createRepository()
      const storedSameContentLine = storedLine({ sessionId: 2, date: daysAgo(4) })
      selfReportsFilesApi.getSelfReportLines.mockResolvedValueOnce([storedSameContentLine])

      await selfReportRepository.saveSelfReports([
        selfReport(),
        selfReport({ message: 'other message' }),
        selfReport({ level: 'ERROR' }),
        selfReport({ origin: '/server/billing/logs/send_invoices.jsonl:9' }),
        selfReport({ message: 'other message', date: new Date('2026-10-01T09:00:00.000Z') })
      ])

      expect(lastSavedLines()).toEqual([
        storedSameContentLine,
        storedLine({ sessionId: 5, date: '2026-10-01T08:00:00.000Z', message: 'other message' }),
        storedLine({ sessionId: 5, date: '2026-10-01T08:00:00.000Z', level: 'ERROR' }),
        storedLine({
          sessionId: 5,
          date: '2026-10-01T08:00:00.000Z',
          origin: '/server/billing/logs/send_invoices.jsonl:9'
        })
      ])
    })

    it('Should not write its file when every self report is already stored', async () => {
      const selfReportRepository = await createRepository()
      selfReportsFilesApi.getSelfReportLines.mockResolvedValueOnce([storedLine()])
      selfReportsFilesApi.saveSelfReportLines.mockClear()

      await selfReportRepository.saveSelfReports([selfReport()])

      expect(selfReportsFilesApi.saveSelfReportLines).not.toHaveBeenCalled()
    })

    it.each([
      [
        'its file cannot be read',
        (): unknown =>
          selfReportsFilesApi.getSelfReportLines.mockRejectedValueOnce(new Error('EACCES'))
      ],
      [
        'its file cannot be written',
        (): unknown =>
          selfReportsFilesApi.saveSelfReportLines.mockRejectedValueOnce(new Error('EACCES'))
      ]
    ])(
      'Should log the error and not throw when %s, and still run the next save',
      async (_, failSave) => {
        const selfReportRepository = await createRepository()
        failSave()

        await expect(selfReportRepository.saveSelfReports([selfReport()])).resolves.toBeUndefined()

        expect(logger.error).toHaveBeenCalledWith(
          { err: expect.any(Error), selfReportsFilePath: SELF_REPORTS_FILE_PATH },
          'Failed to write self reports'
        )

        selfReportsFilesApi.saveSelfReportLines.mockClear()
        await selfReportRepository.saveSelfReports([selfReport()])
        expect(selfReportsFilesApi.saveSelfReportLines).toHaveBeenCalledTimes(1)
      }
    )
  })

  describe('getAllSelfReports', () => {
    it('Should read the self reports of every self-report file, each stored at its file', async () => {
      const otherFilePath = '/self_reports/Echo/logsNotifier.jsonl'
      const selfReportRepository = await createRepository()
      selfReportsFilesApi.getAllSelfReportFilesPaths.mockResolvedValueOnce([
        SELF_REPORTS_FILE_PATH,
        otherFilePath
      ])
      selfReportsFilesApi.getSelfReportLines
        .mockResolvedValueOnce([storedLine({ message: 'bad line' }), 'not a self report'])
        .mockResolvedValueOnce([storedLine({ sessionId: 2, message: 'not notified' })])

      const selfReports = await selfReportRepository.getAllSelfReports()

      expect(selfReports).toMatchObject([
        {
          location: SELF_REPORTS_FILE_PATH,
          locationName: 'parseLogFile',
          groupName: 'self_reports_Echo',
          sessionId: 1,
          message: 'bad line'
        },
        {
          location: otherFilePath,
          locationName: 'logsNotifier',
          groupName: 'self_reports_Echo',
          sessionId: 2,
          message: 'not notified'
        }
      ])
    })

    it.each([
      { reason: 'is in no directory', filePathFromRoot: 'parseLogFile.jsonl' },
      { reason: 'has no path from the root of the file system', filePathFromRoot: undefined }
    ])(
      'Should give no group name to the self reports of a file that $reason',
      async ({ filePathFromRoot }) => {
        const selfReportRepository = await createRepository()
        selfReportsFilesApi.getSelfReportFilePathFromRoot.mockReturnValue(filePathFromRoot)
        selfReportsFilesApi.getAllSelfReportFilesPaths.mockResolvedValueOnce([
          SELF_REPORTS_FILE_PATH
        ])
        selfReportsFilesApi.getSelfReportLines.mockResolvedValueOnce([storedLine()])

        const [storedSelfReport] = await selfReportRepository.getAllSelfReports()

        expect(storedSelfReport.groupName).toBeUndefined()
      }
    )

    it.each([
      [
        'the self-report files cannot be listed',
        (): unknown =>
          selfReportsFilesApi.getAllSelfReportFilesPaths.mockRejectedValueOnce(new Error('EACCES'))
      ],
      [
        'a self-report file cannot be read',
        (): void => {
          selfReportsFilesApi.getAllSelfReportFilesPaths.mockResolvedValueOnce([
            SELF_REPORTS_FILE_PATH
          ])
          selfReportsFilesApi.getSelfReportLines.mockRejectedValueOnce(new Error('EACCES'))
        }
      ]
    ])('Should log the error and give no self report when %s', async (_, failRead) => {
      const selfReportRepository = await createRepository()
      failRead()

      await expect(selfReportRepository.getAllSelfReports()).resolves.toEqual([])

      expect(logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        'Failed to read self reports'
      )
    })
  })
})

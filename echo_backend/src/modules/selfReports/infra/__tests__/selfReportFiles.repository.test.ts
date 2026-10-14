import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import type { SelfReport } from '../../domain/selfReport.js'
import type { SelfReportRepository } from '../../domain/selfReport.repository.js'
import { createSelfReportFilesRepository } from '../selfReportFiles.repository.js'

const SELF_REPORTS_FILE_PATH = '/self_reports/Echo/logFiles.jsonl'
const SESSION_FILE_PATH = '/fake/data/log_files_self_reports_session.json'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const logger = { error: vi.fn() }
const filesService = getMockFilesService()

const options = {
  filesService,
  selfReportsDirPath: '/self_reports/Echo',
  groupRootDirPath: '/self_reports',
  selfReportFileName: 'logFiles.jsonl',
  sessionFilePath: SESSION_FILE_PATH,
  retentionDays: 10,
  isEachProblemStoredOnce: true,
  logger
}

/** The lines of the self-report file, which its updates are given and replace. */
let storedLines: string[]
/** The lines each write of the self-report file made its content, in order. */
let writtenLines: string[][]

/**
 * Creates the repository of `options`, with `overrides` on top, whose set up the tests of its
 * methods do not make fail.
 */
const createRepository = async (
  overrides: Partial<typeof options> = {}
): Promise<SelfReportRepository> =>
  (await createSelfReportFilesRepository({ ...options, ...overrides }))!

/**
 * A self report to save, which the repository stores with its session, the 5, unless `overrides`
 * says otherwise.
 */
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

/**
 * A line of a self-report file, reported a day ago during the session 1 unless `overrides` says
 * otherwise.
 */
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

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  storedLines = []
  writtenLines = []
  filesService.getFileContent.mockResolvedValue(JSON.stringify({ lastSessionId: 4 }))
  filesService.getRelativeFilePath.mockImplementation((filePath: string) => filePath.slice(1))
  filesService.getFileLines.mockImplementation(async () => storedLines)
  filesService.replaceFileLines.mockImplementation(async (_filePath, getLines) => {
    const newLines = getLines(storedLines)

    if (newLines !== undefined) {
      storedLines = newLines
      writtenLines.push(newLines)
    }
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createSelfReportFilesRepository', () => {
  it('Should write its file again without the self reports older than retentionDays, nor the lines that hold none', async () => {
    const retentionLimitLine = storedLine({ date: '2026-09-21T00:00:00.000Z' })
    const recentLine = storedLine({ date: daysAgo(1) })
    storedLines = [
      storedLine({ date: daysAgo(20) }),
      storedLine({ date: '2026-09-20T23:59:59.999Z' }),
      retentionLimitLine,
      'not a self report',
      recentLine
    ]

    await createSelfReportFilesRepository(options)

    expect(filesService.replaceFileLines).toHaveBeenCalledWith(
      SELF_REPORTS_FILE_PATH,
      expect.any(Function)
    )
    expect(writtenLines).toEqual([[retentionLimitLine, recentLine]])
  })

  it('Should save the last session id plus one, once its file is written', async () => {
    const steps: string[] = []
    filesService.replaceFileLines.mockImplementationOnce(async () => {
      steps.push('replaceFileLines')
    })
    filesService.replaceFileContent.mockImplementationOnce(async () => {
      steps.push('replaceFileContent')
    })

    await createSelfReportFilesRepository(options)

    expect(filesService.replaceFileContent).toHaveBeenCalledExactlyOnceWith(
      SESSION_FILE_PATH,
      JSON.stringify({ lastSessionId: 5 }, null, 2)
    )
    expect(steps).toEqual(['replaceFileLines', 'replaceFileContent'])
  })

  it.each([
    {
      reason: 'its file cannot be written, without saving its session id',
      failSetup: (): unknown =>
        filesService.replaceFileLines.mockRejectedValueOnce(new Error('EACCES')),
      sessionIdSavesCount: 0
    },
    {
      reason: 'the session id cannot be saved',
      failSetup: (): unknown =>
        filesService.replaceFileContent.mockRejectedValueOnce(new Error('EACCES')),
      sessionIdSavesCount: 1
    }
  ])(
    'Should create no repository and log the error when $reason',
    async ({ failSetup, sessionIdSavesCount }) => {
      failSetup()

      const selfReportRepository = await createSelfReportFilesRepository(options)

      expect(selfReportRepository).toBeUndefined()
      expect(filesService.replaceFileContent).toHaveBeenCalledTimes(sessionIdSavesCount)
      expect(logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error), selfReportsFilePath: SELF_REPORTS_FILE_PATH },
        'Failed to set up self reports'
      )
    }
  )

  describe('saveSelfReports', () => {
    it('Should do nothing when there is no self report', async () => {
      const selfReportRepository = await createRepository()
      filesService.replaceFileLines.mockClear()

      await selfReportRepository.saveSelfReports([])

      expect(filesService.replaceFileLines).not.toHaveBeenCalled()
    })

    it('Should store the self reports after the stored ones, in the order they are given, whatever their dates', async () => {
      const selfReportRepository = await createRepository()
      const storedTodayLine = storedLine({ date: daysAgo(0), message: 'stored today' })
      const storedTwoDaysAgoLine = storedLine({ date: daysAgo(2), message: 'stored two days ago' })
      storedLines = [storedTodayLine, 'not a self report', storedTwoDaysAgoLine]

      await selfReportRepository.saveSelfReports([
        selfReport({ date: new Date(daysAgo(0)), message: 'reported now' }),
        selfReport({ date: new Date(daysAgo(3)), message: 'reported three days ago' })
      ])

      expect(storedLines).toEqual([
        storedTodayLine,
        storedTwoDaysAgoLine,
        storedLine({ sessionId: 5, date: daysAgo(0), message: 'reported now' }),
        storedLine({ sessionId: 5, date: daysAgo(3), message: 'reported three days ago' })
      ])
    })

    it('Should leave out the self reports with the level, the message and the origin of a stored one, or of one given before', async () => {
      const selfReportRepository = await createRepository()
      const storedSameContentLine = storedLine({ sessionId: 2, date: daysAgo(4) })
      storedLines = [storedSameContentLine]

      await selfReportRepository.saveSelfReports([
        selfReport(),
        selfReport({ message: 'other message' }),
        selfReport({ level: 'ERROR' }),
        selfReport({ origin: '/server/billing/logs/send_invoices.jsonl:9' }),
        selfReport({ message: 'other message', date: new Date('2026-10-01T09:00:00.000Z') })
      ])

      expect(storedLines).toEqual([
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

    it('Should store again a problem whose self report is older than retentionDays, and leave the old one out', async () => {
      const selfReportRepository = await createRepository()
      const recentLine = storedLine({ date: daysAgo(10), message: 'kept line' })
      storedLines = [storedLine({ date: daysAgo(11) }), recentLine]

      await selfReportRepository.saveSelfReports([selfReport()])

      expect(storedLines).toEqual([
        recentLine,
        storedLine({ sessionId: 5, date: '2026-10-01T08:00:00.000Z' })
      ])
    })

    it('Should not write its file when every self report is already stored', async () => {
      const selfReportRepository = await createRepository()
      storedLines = [storedLine()]
      writtenLines = []

      await selfReportRepository.saveSelfReports([selfReport()])

      expect(writtenLines).toEqual([])
    })

    it('Should log the error and not throw when its file cannot be updated, and still run the next save', async () => {
      const selfReportRepository = await createRepository()
      filesService.replaceFileLines.mockRejectedValueOnce(new Error('EACCES'))

      await expect(selfReportRepository.saveSelfReports([selfReport()])).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error), selfReportsFilePath: SELF_REPORTS_FILE_PATH },
        'Failed to write self reports'
      )

      writtenLines = []
      await selfReportRepository.saveSelfReports([selfReport()])
      expect(writtenLines).toHaveLength(1)
    })
  })

  describe('getSelfReports', () => {
    it.each([
      { reason: 'is in no directory', relativeFilePath: 'logFiles.jsonl' },
      { reason: 'is not below groupRootDirPath', relativeFilePath: undefined }
    ])(
      'Should give no group name to the self reports of a file that $reason',
      async ({ relativeFilePath }) => {
        filesService.getRelativeFilePath.mockReturnValue(relativeFilePath)
        const selfReportRepository = await createRepository()
        storedLines = [storedLine()]

        const [storedSelfReport] = await selfReportRepository.getSelfReports()

        expect(storedSelfReport.groupName).toBeUndefined()
      }
    )

    it('Should leave out the self reports that became older than retentionDays since the last write of its file', async () => {
      const selfReportRepository = await createRepository()
      const keptLine = storedLine({ date: daysAgo(7), message: 'kept line' })
      storedLines = [storedLine({ date: daysAgo(9) }), keptLine]
      vi.setSystemTime(new Date(NOW.getTime() + 2 * MILLISECONDS_PER_DAY))

      const selfReports = await selfReportRepository.getSelfReports()

      expect(selfReports.map(({ message }) => message)).toEqual(['kept line'])
      expect(storedLines).toHaveLength(2)
    })

    it('Should log the error and give no self report when its file cannot be read', async () => {
      const selfReportRepository = await createRepository()
      filesService.getFileLines.mockRejectedValueOnce(new Error('EACCES'))

      await expect(selfReportRepository.getSelfReports()).resolves.toEqual([])

      expect(logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error), selfReportsFilePath: SELF_REPORTS_FILE_PATH },
        'Failed to read self reports'
      )
    })
  })
})

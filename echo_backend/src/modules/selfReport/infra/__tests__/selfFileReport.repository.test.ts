import type { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockSelfReportsConfig } from '../../../../test/mocks/configs.js'
import type { RawJsonLogLine } from '../../../logs/infra/dto/rawJsonLog.dto.js'
import type { SelfReport } from '../../domain/selfReport.js'
import { createSelfFileReportRepository } from '../selfFileReport.repository.js'

const SELF_REPORTS_DIR = '/server_logs/self_reports/Echo/log'
const SELF_REPORT_FILE_NAME = 'parseLogFile.jsonl'
const SELF_REPORT_FILE_PATH = `${SELF_REPORTS_DIR}/${SELF_REPORT_FILE_NAME}`

const logger = { error: vi.fn() } as unknown as FastifyBaseLogger

const logsFilesApi = {
  getAllLogFiles: vi.fn(),
  getRawLogLines: vi.fn(),
  createDirectory: vi.fn(),
  rotateLogFile: vi.fn(),
  deleteLogFileSelectedLines: vi.fn(),
  appendLogFileLines: vi.fn()
}

const sessionJobIdApi = {
  getLastSessionJobId: vi.fn(),
  saveLastSessionJobId: vi.fn()
}

const selfReportsConfig = getMockSelfReportsConfig({
  retentionDays: 10,
  selfReportsDirPath: SELF_REPORTS_DIR
})

const options = {
  logsFilesApi,
  sessionJobIdApi,
  selfReportsConfig,
  selfReportFileName: SELF_REPORT_FILE_NAME,
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

const rawJsonLogLine = (overrides: Partial<RawJsonLogLine> = {}): RawJsonLogLine => ({
  job_id: 1,
  timestamp: '2020-01-01T00:00:00.000Z',
  status: 'WARNING',
  message: 'bad line',
  call_file: 'someFile',
  call_line: 3,
  ...overrides
})

const appendedLines = (): RawJsonLogLine[] =>
  logsFilesApi.appendLogFileLines.mock.lastCall?.[1] as RawJsonLogLine[]

beforeEach(() => {
  vi.clearAllMocks()
  sessionJobIdApi.getLastSessionJobId.mockResolvedValue(4)
  sessionJobIdApi.saveLastSessionJobId.mockResolvedValue(undefined)
  logsFilesApi.createDirectory.mockResolvedValue(undefined)
  logsFilesApi.rotateLogFile.mockResolvedValue(undefined)
  logsFilesApi.deleteLogFileSelectedLines.mockResolvedValue(undefined)
  logsFilesApi.appendLogFileLines.mockResolvedValue(undefined)
})

describe('createSelfFileReportRepository', () => {
  it('should save the last session jobId plus one as its session jobId', async () => {
    await createSelfFileReportRepository(options)

    expect(sessionJobIdApi.saveLastSessionJobId).toHaveBeenCalledTimes(1)
    expect(sessionJobIdApi.saveLastSessionJobId).toHaveBeenCalledWith(5)
  })

  it('should take 1 as its session jobId when there is no last session jobId', async () => {
    sessionJobIdApi.getLastSessionJobId.mockRejectedValueOnce(new Error('ENOENT'))

    const selfReportRepository = await createSelfFileReportRepository(options)
    await selfReportRepository.saveSelfReports([selfReport()])

    expect(sessionJobIdApi.saveLastSessionJobId).toHaveBeenCalledWith(1)
    expect(appendedLines()[0].job_id).toBe(1)
  })

  it('should save its session jobId once its file is rotated', async () => {
    const steps: string[] = []
    logsFilesApi.rotateLogFile.mockImplementationOnce(async () => {
      steps.push('rotate')
    })
    sessionJobIdApi.saveLastSessionJobId.mockImplementationOnce(async () => {
      steps.push('save')
    })

    await createSelfFileReportRepository(options)

    expect(steps).toEqual(['rotate', 'save'])
  })

  it('should not save its session jobId when rotating its file fails', async () => {
    logsFilesApi.rotateLogFile.mockRejectedValueOnce(new Error('EACCES'))

    await createSelfFileReportRepository(options)

    expect(sessionJobIdApi.saveLastSessionJobId).not.toHaveBeenCalled()
  })

  it('should create the self-reports directory', async () => {
    await createSelfFileReportRepository(options)

    expect(logsFilesApi.createDirectory).toHaveBeenCalledTimes(1)
    expect(logsFilesApi.createDirectory).toHaveBeenCalledWith(SELF_REPORTS_DIR)
  })

  it('should rotate its file with retentionDays', async () => {
    await createSelfFileReportRepository(options)

    expect(logsFilesApi.rotateLogFile).toHaveBeenCalledWith(SELF_REPORT_FILE_PATH, 10)
  })

  it('should fall back to a repository that stores nothing when rotating its file fails', async () => {
    logsFilesApi.rotateLogFile.mockRejectedValueOnce(new Error('EACCES'))

    const selfReportRepository = await createSelfFileReportRepository(options)

    expect(logger.error).toHaveBeenCalledWith(
      { err: expect.any(Error), selfReportFileName: SELF_REPORT_FILE_NAME },
      'Failed to set up self reports, disabling them for this session'
    )

    await selfReportRepository.saveSelfReports([selfReport()])
    expect(logsFilesApi.appendLogFileLines).not.toHaveBeenCalled()
  })

  it('should fall back to a repository that stores nothing and log the error when setup fails', async () => {
    logsFilesApi.createDirectory.mockRejectedValueOnce(new Error('EACCES'))

    const selfReportRepository = await createSelfFileReportRepository(options)

    expect(logger.error).toHaveBeenCalledWith(
      { err: expect.any(Error), selfReportFileName: SELF_REPORT_FILE_NAME },
      'Failed to set up self reports, disabling them for this session'
    )

    await selfReportRepository.saveSelfReports([selfReport()])
    expect(logsFilesApi.appendLogFileLines).not.toHaveBeenCalled()
  })

  it('should fall back to a repository that stores nothing when the session jobId cannot be saved', async () => {
    sessionJobIdApi.saveLastSessionJobId.mockRejectedValueOnce(new Error('EACCES'))

    const selfReportRepository = await createSelfFileReportRepository(options)

    expect(logger.error).toHaveBeenCalledWith(
      { err: expect.any(Error), selfReportFileName: SELF_REPORT_FILE_NAME },
      'Failed to set up self reports, disabling them for this session'
    )

    await selfReportRepository.saveSelfReports([selfReport()])
    expect(logsFilesApi.appendLogFileLines).not.toHaveBeenCalled()
  })

  describe('saveSelfReports', () => {
    it('should do nothing when there is no self report', async () => {
      const selfReportRepository = await createSelfFileReportRepository(options)
      vi.clearAllMocks()

      await selfReportRepository.saveSelfReports([])

      expect(logsFilesApi.deleteLogFileSelectedLines).not.toHaveBeenCalled()
      expect(logsFilesApi.appendLogFileLines).not.toHaveBeenCalled()
    })

    it('should append one line per self report to its file, with the session job and its own date', async () => {
      const selfReportRepository = await createSelfFileReportRepository(options)

      await selfReportRepository.saveSelfReports([
        selfReport({ message: 'bad line 1', reportedLine: 1 }),
        selfReport({
          date: new Date('2026-09-20T08:00:00.000Z'),
          message: 'bad line 2',
          level: 'error',
          reportedLine: 4
        })
      ])

      expect(logsFilesApi.appendLogFileLines).toHaveBeenCalledTimes(1)
      expect(logsFilesApi.appendLogFileLines.mock.calls[0][0]).toBe(SELF_REPORT_FILE_PATH)

      expect(appendedLines()).toEqual([
        {
          job_id: 5,
          timestamp: '2026-09-19T14:41:09.669Z',
          status: 'WARNING',
          message: 'bad line 1',
          call_file: 'someFile',
          call_line: 1
        },
        {
          job_id: 5,
          timestamp: '2026-09-20T08:00:00.000Z',
          status: 'ERROR',
          message: 'bad line 2',
          call_file: 'someFile',
          call_line: 4
        }
      ])
    })

    it('should delete the stored duplicates of the self reports before appending them', async () => {
      const selfReportRepository = await createSelfFileReportRepository(options)
      const steps: string[] = []
      logsFilesApi.deleteLogFileSelectedLines.mockImplementationOnce(async () => {
        steps.push('delete')
      })
      logsFilesApi.appendLogFileLines.mockImplementationOnce(async () => {
        steps.push('append')
      })

      await selfReportRepository.saveSelfReports([selfReport()])

      expect(logsFilesApi.deleteLogFileSelectedLines).toHaveBeenCalledWith(
        SELF_REPORT_FILE_PATH,
        expect.any(Function)
      )
      expect(steps).toEqual(['delete', 'append'])
    })

    it('should delete the stored lines with the same file, line and message as a self report', async () => {
      const selfReportRepository = await createSelfFileReportRepository(options)
      const duplicateLine = rawJsonLogLine()
      const duplicateLineOfAnotherJob = rawJsonLogLine({ job_id: 2, status: 'ERROR' })
      const secondDuplicateLine = rawJsonLogLine({ message: 'second', call_line: 7 })

      await selfReportRepository.saveSelfReports([
        selfReport(),
        selfReport({ message: 'second', reportedLine: 7 })
      ])

      const isLogLineToDelete = logsFilesApi.deleteLogFileSelectedLines.mock.lastCall?.[1] as (
        rawJsonLogLine: RawJsonLogLine
      ) => boolean
      expect(
        [
          duplicateLine,
          rawJsonLogLine({ message: 'other' }),
          duplicateLineOfAnotherJob,
          rawJsonLogLine({ call_line: 9 }),
          rawJsonLogLine({ call_file: 'otherFile' }),
          secondDuplicateLine
        ].filter(isLogLineToDelete)
      ).toEqual([duplicateLine, duplicateLineOfAnotherJob, secondDuplicateLine])
    })

    it('should log the error and not append when deleting the stored duplicates fails', async () => {
      const selfReportRepository = await createSelfFileReportRepository(options)
      logsFilesApi.deleteLogFileSelectedLines.mockRejectedValueOnce(new Error('EACCES'))

      await expect(selfReportRepository.saveSelfReports([selfReport()])).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error), selfReportFileName: SELF_REPORT_FILE_NAME },
        'Failed to write self reports'
      )
      expect(logsFilesApi.appendLogFileLines).not.toHaveBeenCalled()
    })

    it('should log the error and not throw when storing fails, and still run the next save', async () => {
      const selfReportRepository = await createSelfFileReportRepository(options)
      logsFilesApi.appendLogFileLines.mockRejectedValueOnce(new Error('EACCES'))

      await expect(selfReportRepository.saveSelfReports([selfReport()])).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error), selfReportFileName: SELF_REPORT_FILE_NAME },
        'Failed to write self reports'
      )

      await selfReportRepository.saveSelfReports([selfReport()])
      expect(logsFilesApi.appendLogFileLines).toHaveBeenCalledTimes(2)
    })
  })
})

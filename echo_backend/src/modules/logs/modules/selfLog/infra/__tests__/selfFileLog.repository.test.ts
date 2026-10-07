import { LogCategory } from '@echo/utilities'
import type { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../utils/getNextSessionJobId.js')
vi.mock('../utils/pruneOldSelfLogFileLines.js')
vi.mock('../utils/deleteStoredSelfLogsDuplicate.js')

import type { SelfLog } from '../../domain/selfLog.js'
import { createSelfFileLogRepository } from '../selfFileLog.repository.js'
import { deleteStoredSelfLogsDuplicate } from '../utils/deleteStoredSelfLogsDuplicate.js'
import { getNextSessionJobId } from '../utils/getNextSessionJobId.js'
import { pruneOldSelfLogFileLines } from '../utils/pruneOldSelfLogFileLines.js'

const SELF_LOG_FILE_NAME = 'parseLogFile.jsonl'

const logger = { error: vi.fn() } as unknown as FastifyBaseLogger

const selfFileLogApi = {
  createSelfLogsDirectory: vi.fn(),
  getRawSelfLogLines: vi.fn(),
  replaceRawSelfLogLines: vi.fn(),
  deleteRawSelfLogLines: vi.fn(),
  appendRawSelfLogLines: vi.fn()
}

const options = {
  selfFileLogApi,
  selfLogFileName: SELF_LOG_FILE_NAME,
  retentionDays: 10,
  logger
}

const selfLog = (overrides: Partial<SelfLog> = {}): SelfLog => ({
  category: LogCategory.WARNING,
  message: 'bad line',
  callFile: 'someFile',
  callLine: 3,
  ...overrides
})

const appendedLines = (): Array<Record<string, unknown>> =>
  (selfFileLogApi.appendRawSelfLogLines.mock.lastCall?.[1] as string[]).map((line) =>
    JSON.parse(line)
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getNextSessionJobId).mockResolvedValue(5)
  vi.mocked(pruneOldSelfLogFileLines).mockResolvedValue(undefined)
  vi.mocked(deleteStoredSelfLogsDuplicate).mockResolvedValue(undefined)
  selfFileLogApi.createSelfLogsDirectory.mockResolvedValue(undefined)
  selfFileLogApi.getRawSelfLogLines.mockResolvedValue([])
  selfFileLogApi.replaceRawSelfLogLines.mockResolvedValue(undefined)
  selfFileLogApi.deleteRawSelfLogLines.mockResolvedValue(undefined)
  selfFileLogApi.appendRawSelfLogLines.mockResolvedValue(undefined)
})

describe('createSelfFileLogRepository', () => {
  it('should create the self-logs directory', async () => {
    await createSelfFileLogRepository(options)

    expect(selfFileLogApi.createSelfLogsDirectory).toHaveBeenCalledTimes(1)
  })

  it('should prune its file with retentionDays', async () => {
    await createSelfFileLogRepository(options)

    expect(pruneOldSelfLogFileLines).toHaveBeenCalledWith(selfFileLogApi, SELF_LOG_FILE_NAME, 10)
  })

  it('should fall back to a repository that stores nothing when pruning its file fails', async () => {
    vi.mocked(pruneOldSelfLogFileLines).mockRejectedValueOnce(new Error('EACCES'))

    const selfLogRepository = await createSelfFileLogRepository(options)

    expect(logger.error).toHaveBeenCalledWith(
      { err: expect.any(Error), selfLogFileName: SELF_LOG_FILE_NAME },
      'Failed to set up self logs, disabling them for this session'
    )

    await selfLogRepository.saveSelfLogs([selfLog()])
    expect(selfFileLogApi.appendRawSelfLogLines).not.toHaveBeenCalled()
  })

  it('should fall back to a repository that stores nothing and log the error when setup fails', async () => {
    selfFileLogApi.createSelfLogsDirectory.mockRejectedValueOnce(new Error('EACCES'))

    const selfLogRepository = await createSelfFileLogRepository(options)

    expect(logger.error).toHaveBeenCalledWith(
      { err: expect.any(Error), selfLogFileName: SELF_LOG_FILE_NAME },
      'Failed to set up self logs, disabling them for this session'
    )

    await selfLogRepository.saveSelfLogs([selfLog()])
    expect(selfFileLogApi.appendRawSelfLogLines).not.toHaveBeenCalled()
  })

  it('should fall back to a repository that stores nothing when the session jobId cannot be taken', async () => {
    vi.mocked(getNextSessionJobId).mockRejectedValueOnce(new Error('EACCES'))

    const selfLogRepository = await createSelfFileLogRepository(options)

    expect(logger.error).toHaveBeenCalledWith(
      { err: expect.any(Error), selfLogFileName: SELF_LOG_FILE_NAME },
      'Failed to set up self logs, disabling them for this session'
    )

    await selfLogRepository.saveSelfLogs([selfLog()])
    expect(selfFileLogApi.appendRawSelfLogLines).not.toHaveBeenCalled()
  })

  describe('saveSelfLogs', () => {
    it('should do nothing when there is no self log', async () => {
      const selfLogRepository = await createSelfFileLogRepository(options)
      vi.clearAllMocks()

      await selfLogRepository.saveSelfLogs([])

      expect(deleteStoredSelfLogsDuplicate).not.toHaveBeenCalled()
      expect(selfFileLogApi.appendRawSelfLogLines).not.toHaveBeenCalled()
    })

    it('should append one line per self log to its file, with the session job and the date', async () => {
      const selfLogRepository = await createSelfFileLogRepository(options)

      await selfLogRepository.saveSelfLogs([
        selfLog({ message: 'bad line 1', callLine: 1 }),
        selfLog({ category: LogCategory.ERROR, message: 'bad line 2', callLine: 4 })
      ])

      expect(selfFileLogApi.appendRawSelfLogLines).toHaveBeenCalledTimes(1)
      expect(selfFileLogApi.appendRawSelfLogLines.mock.calls[0][0]).toBe(SELF_LOG_FILE_NAME)

      const lines = appendedLines()
      expect(lines).toEqual([
        {
          job_id: 5,
          timestamp: expect.any(String),
          status: 'WARNING',
          message: 'bad line 1',
          call_file: 'someFile',
          call_line: 1
        },
        {
          job_id: 5,
          timestamp: expect.any(String),
          status: 'ERROR',
          message: 'bad line 2',
          call_file: 'someFile',
          call_line: 4
        }
      ])
      expect(new Date(lines[0].timestamp as string).toISOString()).toBe(lines[0].timestamp)
    })

    it('should delete the stored duplicates of the self logs before appending them', async () => {
      const selfLogRepository = await createSelfFileLogRepository(options)
      const steps: string[] = []
      vi.mocked(deleteStoredSelfLogsDuplicate).mockImplementationOnce(async () => {
        steps.push('delete')
      })
      selfFileLogApi.appendRawSelfLogLines.mockImplementationOnce(async () => {
        steps.push('append')
      })

      await selfLogRepository.saveSelfLogs([selfLog()])

      expect(deleteStoredSelfLogsDuplicate).toHaveBeenCalledWith(
        selfFileLogApi,
        SELF_LOG_FILE_NAME,
        [selfLog()]
      )
      expect(steps).toEqual(['delete', 'append'])
    })

    it('should log the error and not append when deleting the stored duplicates fails', async () => {
      const selfLogRepository = await createSelfFileLogRepository(options)
      vi.mocked(deleteStoredSelfLogsDuplicate).mockRejectedValueOnce(new Error('EACCES'))

      await expect(selfLogRepository.saveSelfLogs([selfLog()])).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error), selfLogFileName: SELF_LOG_FILE_NAME },
        'Failed to write self logs'
      )
      expect(selfFileLogApi.appendRawSelfLogLines).not.toHaveBeenCalled()
    })

    it('should log the error and not throw when storing fails, and still run the next save', async () => {
      const selfLogRepository = await createSelfFileLogRepository(options)
      selfFileLogApi.appendRawSelfLogLines.mockRejectedValueOnce(new Error('EACCES'))

      await expect(selfLogRepository.saveSelfLogs([selfLog()])).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error), selfLogFileName: SELF_LOG_FILE_NAME },
        'Failed to write self logs'
      )

      await selfLogRepository.saveSelfLogs([selfLog()])
      expect(selfFileLogApi.appendRawSelfLogLines).toHaveBeenCalledTimes(2)
    })
  })
})

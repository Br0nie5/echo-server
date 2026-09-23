import type { Log } from '@echo/utilities'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../utils/parseLogFile.js', () => ({ parseLogFile: vi.fn() }))

import { createFileLogsRepository } from '../logs.repository.js'
import type { SelfLogsWriter } from '../selfLogs/selfLogs.writer.js'
import { parseLogFile } from '../utils/parseLogFile.js'

const mockLog = (id: string): Log => ({
  id,
  date: '2026-01-01T10:00:00.000Z',
  fileName: 'f',
  jobId: 1,
  category: 'INFO',
  message: id,
  callFile: 'f.sh',
  callLine: 1
})

const LOGS_DIR_PATH = '/path/to/logs'
const filesService = {
  getAllFilesPaths: vi.fn(),
  readFile: vi.fn(),
  getFileNameWithoutExtension: vi.fn()
}
const selfLogsWriter: SelfLogsWriter = {
  isSelfLogFile: (): boolean => false,
  logParseFailures: vi.fn()
}
const LogsRepository = createFileLogsRepository(LOGS_DIR_PATH, filesService, selfLogsWriter)

describe('LogsRepository.findAll', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should parse only the .jsonl files of the logs directory and flattens the result', async () => {
    filesService.getAllFilesPaths.mockResolvedValue(['a.jsonl', 'notes.txt', 'b.jsonl'])
    vi.mocked(parseLogFile).mockImplementation(async (path) =>
      path === 'a.jsonl' ? [mockLog('a1'), mockLog('a2')] : [mockLog('b1')]
    )

    const logs = await LogsRepository.findAll()

    expect(filesService.getAllFilesPaths).toHaveBeenCalledWith(LOGS_DIR_PATH)
    expect(parseLogFile).toHaveBeenCalledTimes(2)
    expect(parseLogFile).toHaveBeenCalledWith(
      'a.jsonl',
      LOGS_DIR_PATH,
      filesService,
      selfLogsWriter
    )
    expect(logs.map((log) => log.id)).toEqual(['a1', 'a2', 'b1'])
  })

  it('should return an empty array when there are no log files', async () => {
    filesService.getAllFilesPaths.mockResolvedValue([])

    expect(await LogsRepository.findAll()).toEqual([])
  })
})

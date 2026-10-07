import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { SelfLogsWriter } from '../../selfLogs/selfLogs.writer.js'
import type { LogFileDto } from '../dto/logFile.dto.js'
import type { RawLogLineDto } from '../dto/rawLogLine.dto.js'
import { createFileLogsRepository } from '../fileLogs.repository.js'

const SELF_LOG_FILE_PATH = '/logs/server/Echo/log/parseLogFile.jsonl'

const lineContents = [
  '{"job_id":1,"timestamp":"2024-05-12T14:30:00.001Z","status":"INFO","message":"First log","call_file":"file.sh","call_line":1}',
  '{"job_id":2,"timestamp":"2024-05-12T15:00:00.145Z","status":"ERROR","message":"Second [Test] log","call_file":"file.sh","call_line":2}',
  '{"job_id":3,"timestamp":"2024-05-12 14:30:00.000","status":"INFO","message":"Old timestamp format","call_file":"file.sh","call_line":3}',
  '{"job_id":3,"timestamp":"2024-05-12T14:33:00.334Z","status":"INFO","message":"Log with a\\nline breaker","call_file":"file.sh","call_line":4}',
  'invalid line'
]

const logFile = (overrides: Partial<LogFileDto> = {}): LogFileDto => ({
  path: '/logs/docker/utils/file.jsonl',
  fileName: 'myFile',
  groupName: 'utils',
  ...overrides
})

const rawLogLinesOf = (file: LogFileDto, contents: string[]): RawLogLineDto[] =>
  contents.map((content, index) => ({ logFile: file, index, content }))

const fileLogsApi = {
  getAllLogFilesPaths: vi.fn(),
  getAllLogsFromFiles: vi.fn(),
  getAllLogsFromFile: vi.fn(),
  getRawLogLines: vi.fn()
}
const selfLogsWriter: SelfLogsWriter = {
  isSelfLogFile: (filePath): boolean => filePath === SELF_LOG_FILE_PATH,
  logParseFailures: vi.fn()
}
const fileLogsRepository = createFileLogsRepository(fileLogsApi, selfLogsWriter)

describe('FileLogsRepository.findAllLogs', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should convert the valid lines of a file to logs and report the others', async () => {
    const file = logFile()
    fileLogsApi.getAllLogsFromFiles.mockResolvedValue([file])
    fileLogsApi.getRawLogLines.mockResolvedValue(rawLogLinesOf(file, lineContents))

    const logs = await fileLogsRepository.findAllLogs()

    expect(fileLogsApi.getRawLogLines).toHaveBeenCalledWith(file)
    expect(logs).toHaveLength(3)
    expect(logs[0]).toMatchObject({
      jobId: 1,
      category: 'INFO',
      message: 'First log',
      fileName: 'myFile',
      groupName: 'utils',
      callFile: 'file.sh',
      callLine: 1
    })
    expect(logs[1]).toMatchObject({
      jobId: 2,
      category: 'ERROR',
      message: 'Second [Test] log',
      callFile: 'file.sh',
      callLine: 2
    })
    expect(logs[2]).toMatchObject({
      jobId: 3,
      category: 'INFO',
      message: 'Log with a\nline breaker',
      callFile: 'file.sh',
      callLine: 4
    })

    expect(selfLogsWriter.logParseFailures).toHaveBeenCalledWith(
      [
        { rawLogLine: lineContents[2], lineIndex: 3 },
        { rawLogLine: 'invalid line', lineIndex: 5 }
      ],
      'parseLogFile.jsonl',
      'myFile'
    )
  })

  it('should flatten the logs of every file', async () => {
    const fileA = logFile({ fileName: 'a' })
    const fileB = logFile({ fileName: 'b' })
    fileLogsApi.getAllLogsFromFiles.mockResolvedValue([fileA, fileB])
    fileLogsApi.getRawLogLines.mockImplementation(async (file: LogFileDto) =>
      file === fileA
        ? rawLogLinesOf(fileA, lineContents.slice(0, 2))
        : rawLogLinesOf(fileB, lineContents.slice(3, 4))
    )

    const logs = await fileLogsRepository.findAllLogs()

    expect(logs.map((log) => [log.fileName, log.jobId])).toEqual([
      ['a', 1],
      ['a', 2],
      ['b', 3]
    ])
  })

  it('should return an empty array when there are no log files', async () => {
    fileLogsApi.getAllLogsFromFiles.mockResolvedValue([])

    expect(await fileLogsRepository.findAllLogs()).toEqual([])
  })

  it('should return no log for an empty file', async () => {
    fileLogsApi.getAllLogsFromFiles.mockResolvedValue([logFile({ fileName: 'empty' })])
    fileLogsApi.getRawLogLines.mockResolvedValue([])

    expect(await fileLogsRepository.findAllLogs()).toEqual([])
    expect(selfLogsWriter.logParseFailures).toHaveBeenCalledWith([], 'parseLogFile.jsonl', 'empty')
  })

  it('should not report the failures of a file that is itself a self-log', async () => {
    const selfLogFile = logFile({ path: SELF_LOG_FILE_PATH })
    fileLogsApi.getAllLogsFromFiles.mockResolvedValue([selfLogFile])
    fileLogsApi.getRawLogLines.mockResolvedValue(rawLogLinesOf(selfLogFile, ['invalid line']))

    await fileLogsRepository.findAllLogs()

    expect(selfLogsWriter.logParseFailures).not.toHaveBeenCalled()
  })
})

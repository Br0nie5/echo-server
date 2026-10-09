import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import type { SelfReportRepository } from '../../../selfReport/domain/selfReport.repository.js'
import type { LogFileDto } from '../dto/logFile.dto.js'
import type { RawLogLineDto } from '../dto/rawLogLine.dto.js'
import { createLogsFilesRepository } from '../logsFiles.repository.js'

const lineContents = [
  '{"job_id":1,"timestamp":"2024-05-12T14:30:00.001Z","status":"INFO","message":"First log","call_file":"file.sh","call_line":1}',
  '{"job_id":2,"timestamp":"2024-05-12T15:00:00.145Z","status":"ERROR","message":"Second [Test] log","call_file":"file.sh","call_line":2}',
  '{"job_id":3,"timestamp":"2024-05-12 14:30:00.000","status":"INFO","message":"Old timestamp format","call_file":"file.sh","call_line":3}',
  '{"job_id":3,"timestamp":"2024-05-12T14:33:00.334Z","status":"INFO","message":"Log with a\\nline breaker","call_file":"file.sh","call_line":4}',
  'invalid line'
]

const READ_DATE = new Date('2026-09-19T14:41:09.669Z')

const logFile = (overrides: Partial<LogFileDto> = {}): LogFileDto => ({
  path: '/logs/docker/utils/file.jsonl',
  fileName: 'myFile',
  groupName: 'utils',
  ...overrides
})

const rawLogLinesOf = (file: LogFileDto, contents: string[]): RawLogLineDto[] =>
  contents.map((content, index) => ({ logFile: file, index, content }))

const logsFilesApi = {
  getAllLogFiles: vi.fn(),
  getRawLogLines: vi.fn(),
  createDirectory: vi.fn(),
  rotateLogFile: vi.fn(),
  deleteLogFileSelectedLines: vi.fn(),
  appendLogFileLines: vi.fn()
}
const selfReportRepository: SelfReportRepository = {
  saveSelfReports: vi.fn()
}
const logsFilesRepository = createLogsFilesRepository(logsFilesApi, selfReportRepository)

describe('LogsFilesRepository.findAllLogs', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(READ_DATE)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should convert the valid lines of a file to logs and report the others', async () => {
    const file = logFile()
    logsFilesApi.getAllLogFiles.mockResolvedValue([file])
    logsFilesApi.getRawLogLines.mockResolvedValue(rawLogLinesOf(file, lineContents))

    const logs = await logsFilesRepository.findAllLogs()

    expect(logsFilesApi.getRawLogLines).toHaveBeenCalledWith(file)
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

    expect(selfReportRepository.saveSelfReports).toHaveBeenCalledWith([
      {
        date: READ_DATE,
        message: lineContents[2],
        level: 'warning',
        reportedFile: 'myFile',
        reportedLine: 3
      },
      {
        date: READ_DATE,
        message: 'invalid line',
        level: 'warning',
        reportedFile: 'myFile',
        reportedLine: 5
      }
    ])
  })

  it('should flatten the logs of every file', async () => {
    const fileA = logFile({ fileName: 'a' })
    const fileB = logFile({ fileName: 'b' })
    logsFilesApi.getAllLogFiles.mockResolvedValue([fileA, fileB])
    logsFilesApi.getRawLogLines.mockImplementation(async (file: LogFileDto) =>
      file === fileA
        ? rawLogLinesOf(fileA, lineContents.slice(0, 2))
        : rawLogLinesOf(fileB, lineContents.slice(3, 4))
    )

    const logs = await logsFilesRepository.findAllLogs()

    expect(logs.map((log) => [log.fileName, log.jobId])).toEqual([
      ['a', 1],
      ['a', 2],
      ['b', 3]
    ])
  })

  it('should return an empty array when there are no log files', async () => {
    logsFilesApi.getAllLogFiles.mockResolvedValue([])

    expect(await logsFilesRepository.findAllLogs()).toEqual([])
  })

  it('should return no log for an empty file', async () => {
    logsFilesApi.getAllLogFiles.mockResolvedValue([logFile({ fileName: 'empty' })])
    logsFilesApi.getRawLogLines.mockResolvedValue([])

    expect(await logsFilesRepository.findAllLogs()).toEqual([])
    expect(selfReportRepository.saveSelfReports).toHaveBeenCalledWith([])
  })

  it('should report the failures of every file in a single save, self-report files included', async () => {
    const fileA = logFile({ fileName: 'a' })
    const selfReportFile = logFile({
      path: '/server_logs/self_reports/Echo/log/parseLogFile.jsonl',
      fileName: 'parseLogFile'
    })
    logsFilesApi.getAllLogFiles.mockResolvedValue([fileA, selfReportFile])
    logsFilesApi.getRawLogLines.mockImplementation(async (file: LogFileDto) =>
      rawLogLinesOf(file, file === fileA ? [lineContents[0], 'invalid line'] : ['cut line'])
    )

    await logsFilesRepository.findAllLogs()

    expect(selfReportRepository.saveSelfReports).toHaveBeenCalledTimes(1)
    expect(selfReportRepository.saveSelfReports).toHaveBeenCalledWith([
      {
        date: READ_DATE,
        message: 'invalid line',
        level: 'warning',
        reportedFile: 'a',
        reportedLine: 2
      },
      {
        date: READ_DATE,
        message: 'cut line',
        level: 'warning',
        reportedFile: 'parseLogFile',
        reportedLine: 1
      }
    ])
  })
})

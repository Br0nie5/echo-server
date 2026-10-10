import type { Log } from '@echo/utilities'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
  getLogFile: vi.fn(),
  getRawLogLines: vi.fn(),
  saveRawLogLines: vi.fn()
}
const logsFilesRepository = createLogsFilesRepository(logsFilesApi)

describe('LogsFilesRepository', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(READ_DATE)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getAllLogs', () => {
    it('Should convert the valid lines of a file to logs and give a self report for the others', async () => {
      const file = logFile()
      logsFilesApi.getAllLogFiles.mockResolvedValue([file])
      logsFilesApi.getRawLogLines.mockResolvedValue(rawLogLinesOf(file, lineContents))

      const { logs, selfReports } = await logsFilesRepository.getAllLogs()

      expect(logsFilesApi.getRawLogLines).toHaveBeenCalledWith(file)
      expect(logs).toHaveLength(3)
      expect(logs[0]).toMatchObject({
        jobId: 1,
        category: 'INFO',
        message: 'First log',
        location: '/logs/docker/utils/file.jsonl',
        locationName: 'myFile',
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

      expect(selfReports).toEqual([
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

    it('Should flatten the logs of every file', async () => {
      const fileA = logFile({ fileName: 'a' })
      const fileB = logFile({ fileName: 'b' })
      logsFilesApi.getAllLogFiles.mockResolvedValue([fileA, fileB])
      logsFilesApi.getRawLogLines.mockImplementation(async (file: LogFileDto) =>
        file === fileA
          ? rawLogLinesOf(fileA, lineContents.slice(0, 2))
          : rawLogLinesOf(fileB, lineContents.slice(3, 4))
      )

      const { logs } = await logsFilesRepository.getAllLogs()

      expect(logs.map((log) => [log.locationName, log.jobId])).toEqual([
        ['a', 1],
        ['a', 2],
        ['b', 3]
      ])
    })

    it('Should give no log and no self report when there are no log files', async () => {
      logsFilesApi.getAllLogFiles.mockResolvedValue([])

      expect(await logsFilesRepository.getAllLogs()).toEqual({ logs: [], selfReports: [] })
    })

    it('Should give no log and no self report for an empty file', async () => {
      logsFilesApi.getAllLogFiles.mockResolvedValue([logFile({ fileName: 'empty' })])
      logsFilesApi.getRawLogLines.mockResolvedValue([])

      expect(await logsFilesRepository.getAllLogs()).toEqual({ logs: [], selfReports: [] })
    })

    it('Should give the self reports of every file, self-report files included', async () => {
      const fileA = logFile({ fileName: 'a' })
      const selfReportFile = logFile({
        path: '/server_logs/self_reports/Echo/log/parseLogFile.jsonl',
        fileName: 'parseLogFile'
      })
      logsFilesApi.getAllLogFiles.mockResolvedValue([fileA, selfReportFile])
      logsFilesApi.getRawLogLines.mockImplementation(async (file: LogFileDto) =>
        rawLogLinesOf(file, file === fileA ? [lineContents[0], 'invalid line'] : ['cut line'])
      )

      const { selfReports } = await logsFilesRepository.getAllLogs()

      expect(selfReports).toEqual([
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

  describe('getLogs', () => {
    it('Should give the logs of the file at the location, and a self report for its other lines', async () => {
      const file = logFile({ path: '/logs/docker/utils/file.jsonl' })
      logsFilesApi.getLogFile.mockReturnValue(file)
      logsFilesApi.getRawLogLines.mockResolvedValue(
        rawLogLinesOf(file, [lineContents[0], 'invalid line'])
      )

      const { logs, selfReports } = await logsFilesRepository.getLogs(
        '/logs/docker/utils/file.jsonl'
      )

      expect(logsFilesApi.getLogFile).toHaveBeenCalledWith('/logs/docker/utils/file.jsonl')
      expect(logsFilesApi.getRawLogLines).toHaveBeenCalledWith(file)
      expect(logs).toHaveLength(1)
      expect(logs[0]).toMatchObject({
        jobId: 1,
        message: 'First log',
        location: '/logs/docker/utils/file.jsonl',
        locationName: 'myFile',
        groupName: 'utils'
      })
      expect(selfReports).toEqual([
        {
          date: READ_DATE,
          message: 'invalid line',
          level: 'warning',
          reportedFile: 'myFile',
          reportedLine: 2
        }
      ])
    })
  })

  /** Makes `logsFilesApi` give, for any path, the log file of the tests at that path. */
  const mockLogFiles = (): void => {
    logsFilesApi.getLogFile.mockImplementation((filePath: string) => logFile({ path: filePath }))
  }

  describe('saveLogs', () => {
    beforeEach(mockLogFiles)

    const logAt = (location: string, overrides: Partial<Log> = {}): Log => ({
      id: 'whatever',
      location,
      locationName: 'whatever',
      date: '2024-05-12T14:30:00.001Z',
      jobId: 1,
      category: 'INFO',
      message: 'First log',
      callFile: 'file.sh',
      callLine: 1,
      ...overrides
    })

    const secondLogOverrides: Partial<Log> = {
      date: '2024-05-12T15:00:00.145Z',
      jobId: 2,
      category: 'ERROR',
      message: 'Second [Test] log',
      callLine: 2
    }

    it('Should make the logs the lines of the file at their location, in order', async () => {
      await logsFilesRepository.saveLogs([
        logAt('/logs/docker/utils/file.jsonl'),
        logAt('/logs/docker/utils/file.jsonl', secondLogOverrides)
      ])

      const file = logFile({ path: '/logs/docker/utils/file.jsonl' })
      expect(logsFilesApi.getLogFile).toHaveBeenCalledWith('/logs/docker/utils/file.jsonl')
      expect(logsFilesApi.saveRawLogLines).toHaveBeenCalledExactlyOnceWith(
        file,
        rawLogLinesOf(file, lineContents.slice(0, 2))
      )
    })

    it('Should write the logs from the oldest to the newest, whatever the order they are given in', async () => {
      await logsFilesRepository.saveLogs([
        logAt('/logs/file.jsonl', secondLogOverrides),
        logAt('/logs/file.jsonl'),
        logAt('/logs/file.jsonl', { ...secondLogOverrides, message: 'Same date, given later' })
      ])

      const file = logFile({ path: '/logs/file.jsonl' })
      expect(logsFilesApi.saveRawLogLines).toHaveBeenCalledExactlyOnceWith(
        file,
        rawLogLinesOf(file, [
          lineContents[0],
          lineContents[1],
          lineContents[1].replace('Second [Test] log', 'Same date, given later')
        ])
      )
    })

    it('Should save the logs of each location in its own file, all at once', async () => {
      await logsFilesRepository.saveLogs([
        logAt('/logs/a.jsonl'),
        logAt('/logs/b.jsonl', secondLogOverrides),
        logAt('/logs/a.jsonl', secondLogOverrides)
      ])

      expect(logsFilesApi.saveRawLogLines).toHaveBeenCalledTimes(2)
      const fileA = logFile({ path: '/logs/a.jsonl' })
      const fileB = logFile({ path: '/logs/b.jsonl' })
      expect(logsFilesApi.saveRawLogLines).toHaveBeenCalledWith(
        fileA,
        rawLogLinesOf(fileA, lineContents.slice(0, 2))
      )
      expect(logsFilesApi.saveRawLogLines).toHaveBeenCalledWith(
        fileB,
        rawLogLinesOf(fileB, [lineContents[1]])
      )
    })

    it('Should write no file when there is no log', async () => {
      await logsFilesRepository.saveLogs([])

      expect(logsFilesApi.saveRawLogLines).not.toHaveBeenCalled()
    })

    it('Should throw the error of the log files API when a file cannot be written', async () => {
      logsFilesApi.saveRawLogLines.mockRejectedValue(new Error('EACCES'))

      await expect(logsFilesRepository.saveLogs([logAt('/logs/file.jsonl')])).rejects.toThrow(
        'EACCES'
      )
    })
  })

  describe('deleteLogs', () => {
    beforeEach(mockLogFiles)

    it('Should leave the file at the location without any line', async () => {
      await logsFilesRepository.deleteLogs('/logs/docker/utils/file.jsonl')

      expect(logsFilesApi.saveRawLogLines).toHaveBeenCalledExactlyOnceWith(
        logFile({ path: '/logs/docker/utils/file.jsonl' }),
        []
      )
    })
  })
})

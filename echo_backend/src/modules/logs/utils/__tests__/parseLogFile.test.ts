import type { Log } from '@echo/utilities'
import { LogCategory } from '@echo/utilities'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { convertToDateFromFormat } from '../../../../shared/utils/convertToDate.js'
import type { SelfLogsWriter } from '../../selfLogs/selfLogs.writer.js'
import { parseLogFile, parseRawLogLine, parseRawLogs } from '../parseLogFile.js'

describe('parseRawLogLine', () => {
  const baseProps = { groupName: 'myGroup', fileName: 'file1.jsonl' }

  it('should parse a valid log line', () => {
    const result = parseRawLogLine({
      rawLogLine:
        '{"job_id":123,"timestamp":"2024-05-12 14:30:00.386","status":"INFO","message":"Something happened","call_file":"check_logs.jsonl","call_line":4}',
      rawLogIndex: 0,
      ...baseProps
    }) as Log

    expect(result).toMatchObject({
      jobId: 123,
      message: 'Something happened',
      category: LogCategory.INFO,
      groupName: 'myGroup',
      fileName: 'file1.jsonl',
      callFile: 'check_logs.jsonl',
      callLine: 4
    })
    expect(result.date).toBe(convertToDateFromFormat('2024-05-12 14:30:00.386')?.toISOString())
  })

  it('should leave callFile and callLine undefined when absent', () => {
    const result = parseRawLogLine({
      rawLogLine:
        '{"job_id":123,"timestamp":"2024-05-12 14:30:00.386","status":"INFO","message":"Something happened"}',
      rawLogIndex: 0,
      ...baseProps
    }) as Log

    expect(result.callFile).toBeUndefined()
    expect(result.callLine).toBeUndefined()
  })

  it('should return undefined for malformed log line', () => {
    const result = parseRawLogLine({
      rawLogLine: 'Not matching the pattern',
      rawLogIndex: 0,
      ...baseProps
    })
    expect(result).toBeUndefined()
  })

  it('should return undefined for an invalid category', () => {
    const result = parseRawLogLine({
      rawLogLine:
        '{"job_id":1,"timestamp":"2024-05-12 14:30:00.012","status":"INVALID","message":"Bad category"}',
      rawLogIndex: 0,
      ...baseProps
    })
    expect(result).toBeUndefined()
  })

  it('should return undefined for invalid date', () => {
    const result = parseRawLogLine({
      rawLogLine:
        '{"job_id":1,"timestamp":"9999-99-99 25:61:61.999","status":"INFO","message":"Impossible date"}',
      rawLogIndex: 0,
      ...baseProps
    })
    expect(result).toBeUndefined()
  })

  it('should return undefined for invalid json object', () => {
    const result = parseRawLogLine({
      rawLogLine:
        '{"job_id":1,"timestamp":"9999-99-99 25:61:61.999","status":"INFO","invalid_message_key":"Impossible date"}',
      rawLogIndex: 0,
      ...baseProps
    })
    expect(result).toBeUndefined()
  })
})

describe('parseRawLogs', () => {
  it('should separate valid logs from the raw lines that failed to parse', () => {
    const result = parseRawLogs({
      rawLogs: [
        '{"job_id":1,"timestamp":"2024-05-12 14:30:00.123","status":"INFO","message":"Ok log"}',
        'bad line',
        '{"job_id":2,"timestamp":"2024-05-12 15:30:00.456","status":"ERROR","message":"Another log"}'
      ],
      fileName: 'f.log.jsonl',
      groupName: 'grp'
    })

    expect(result.logs.length).toBe(2)
    expect(result.logs[0].jobId).toBe(1)
    expect(result.logs[1].category).toBe(LogCategory.ERROR)
    expect(result.failedLines).toEqual([{ rawLogLine: 'bad line', lineIndex: 2 }])
  })
})

describe('parseLogFile', () => {
  const mockedLogs = [
    '{"job_id":1,"timestamp":"2024-05-12 14:30:00.001","status":"INFO","message":"First log","call_file":"file.jsonl","call_line":1}',
    '{"job_id":2,"timestamp":"2024-05-12 15:00:00.145","status":"ERROR","message":"Second [Test] log","call_file":"file.jsonl","call_line":2}',
    '{"job_id":3,"timestamp":"2024-05-12 14:30:00","status":"INFO","message":"Missing milliseconds"}',
    '{"job_id":3,"timestamp":"2024-05-12 14:33:00.334","status":"INFO","message":"Log with a\\nline breaker","call_file":"file.jsonl","call_line":4}',
    'invalid line'
  ]

  const filesService = {
    getAllFilesPaths: vi.fn(),
    readFile: vi.fn(),
    getFileNameWithoutExtension: vi.fn()
  }

  const selfLogsWriter: SelfLogsWriter = {
    isSelfLogFile: (filePath): boolean => filePath === '/logs/server/Echo/log/parseLogFile.jsonl',
    logParseFailures: vi.fn()
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should parse logs from a file', async () => {
    filesService.readFile.mockResolvedValue(mockedLogs)
    filesService.getFileNameWithoutExtension.mockReturnValue('myFile')

    const result = await parseLogFile(
      '/logs/docker/utils/file.jsonl',
      '/logs',
      filesService,
      selfLogsWriter
    )

    expect(filesService.readFile).toHaveBeenCalledWith('/logs/docker/utils/file.jsonl')
    expect(filesService.getFileNameWithoutExtension).toHaveBeenCalledWith(
      '/logs/docker/utils/file.jsonl'
    )

    expect(result).toHaveLength(3) // only valid logs

    expect(result[0]).toMatchObject({
      jobId: 1,
      category: LogCategory.INFO,
      message: 'First log',
      fileName: 'myFile',
      groupName: 'utils',
      callFile: 'file.jsonl',
      callLine: 1
    })

    expect(result[1]).toMatchObject({
      jobId: 2,
      category: LogCategory.ERROR,
      message: 'Second [Test] log',
      callFile: 'file.jsonl',
      callLine: 2
    })

    expect(result[2]).toMatchObject({
      jobId: 3,
      category: LogCategory.INFO,
      message: 'Log with a\nline breaker',
      callFile: 'file.jsonl',
      callLine: 4
    })

    expect(selfLogsWriter.logParseFailures).toHaveBeenCalledWith(
      [
        { rawLogLine: mockedLogs[2], lineIndex: 3 },
        { rawLogLine: 'invalid line', lineIndex: 5 }
      ],
      'parseLogFile.jsonl',
      'myFile'
    )
  })

  it('should return an empty array if file is empty', async () => {
    filesService.readFile.mockResolvedValue([])
    filesService.getFileNameWithoutExtension.mockReturnValue('empty')

    const result = await parseLogFile('/logs/empty.jsonl', '/logs', filesService, selfLogsWriter)
    expect(result).toEqual([])
    expect(selfLogsWriter.logParseFailures).toHaveBeenCalledWith([], 'parseLogFile.jsonl', 'empty')
  })

  it('should not report failures when parsing a file already in the self-logs directory', async () => {
    filesService.readFile.mockResolvedValue(['invalid line'])
    filesService.getFileNameWithoutExtension.mockReturnValue('parseLogFile')

    await parseLogFile(
      '/logs/server/Echo/log/parseLogFile.jsonl',
      '/logs',
      filesService,
      selfLogsWriter
    )

    expect(selfLogsWriter.logParseFailures).not.toHaveBeenCalled()
  })
})

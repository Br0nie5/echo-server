import { beforeEach, describe, expect, it, vi } from 'vitest'

import { pruneOldSelfLogFileLines } from '../pruneOldSelfLogFileLines.js'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
const SELF_LOG_FILE_NAME = 'parseLogFile.jsonl'

const selfFileLogApi = {
  createSelfLogsDirectory: vi.fn(),
  getRawSelfLogLines: vi.fn(),
  replaceRawSelfLogLines: vi.fn(),
  deleteRawSelfLogLines: vi.fn(),
  appendRawSelfLogLines: vi.fn()
}

const rawSelfLogLine = (timestamp: unknown): string =>
  JSON.stringify({ job_id: 1, timestamp, status: 'WARNING', message: 'bad line' })

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * MILLISECONDS_PER_DAY).toISOString()

beforeEach(() => {
  vi.resetAllMocks()
})

describe('pruneOldSelfLogFileLines', () => {
  it('should remove from the file the lines older than retentionDays and keep the rest', async () => {
    const oldLine = rawSelfLogLine(daysAgo(20))
    const recentLine = rawSelfLogLine(daysAgo(1))
    selfFileLogApi.getRawSelfLogLines.mockResolvedValueOnce([oldLine, recentLine])

    await pruneOldSelfLogFileLines(selfFileLogApi, SELF_LOG_FILE_NAME, 10)

    expect(selfFileLogApi.getRawSelfLogLines).toHaveBeenCalledWith(SELF_LOG_FILE_NAME)
    expect(selfFileLogApi.replaceRawSelfLogLines).toHaveBeenCalledWith(SELF_LOG_FILE_NAME, [
      recentLine
    ])
  })

  it('should empty the file when every line is older than retentionDays', async () => {
    selfFileLogApi.getRawSelfLogLines.mockResolvedValueOnce([rawSelfLogLine(daysAgo(20))])

    await pruneOldSelfLogFileLines(selfFileLogApi, SELF_LOG_FILE_NAME, 10)

    expect(selfFileLogApi.replaceRawSelfLogLines).toHaveBeenCalledWith(SELF_LOG_FILE_NAME, [])
  })

  it('should leave the file untouched when no line is older than retentionDays', async () => {
    selfFileLogApi.getRawSelfLogLines.mockResolvedValueOnce([rawSelfLogLine(daysAgo(1))])

    await pruneOldSelfLogFileLines(selfFileLogApi, SELF_LOG_FILE_NAME, 10)

    expect(selfFileLogApi.replaceRawSelfLogLines).not.toHaveBeenCalled()
  })

  it('should defensively keep the lines it cannot read a date from', async () => {
    selfFileLogApi.getRawSelfLogLines.mockResolvedValueOnce([
      'not json',
      rawSelfLogLine('not a date'),
      rawSelfLogLine(42)
    ])

    await pruneOldSelfLogFileLines(selfFileLogApi, SELF_LOG_FILE_NAME, 10)

    expect(selfFileLogApi.replaceRawSelfLogLines).not.toHaveBeenCalled()
  })
})

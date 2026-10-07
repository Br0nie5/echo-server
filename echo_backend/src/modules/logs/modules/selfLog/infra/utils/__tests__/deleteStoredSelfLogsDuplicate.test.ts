import { LogCategory } from '@echo/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SelfLog } from '../../../domain/selfLog.js'
import { deleteStoredSelfLogsDuplicate } from '../deleteStoredSelfLogsDuplicate.js'

const SELF_LOG_FILE_NAME = 'parseLogFile.jsonl'

const selfFileLogApi = {
  createSelfLogsDirectory: vi.fn(),
  getRawSelfLogLines: vi.fn(),
  replaceRawSelfLogLines: vi.fn(),
  deleteRawSelfLogLines: vi.fn(),
  appendRawSelfLogLines: vi.fn()
}

const selfLog = (overrides: Partial<SelfLog> = {}): SelfLog => ({
  category: LogCategory.WARNING,
  message: 'bad line',
  callFile: 'someFile',
  callLine: 3,
  ...overrides
})

const rawSelfLogLine = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({
    job_id: 1,
    timestamp: '2020-01-01T00:00:00.000Z',
    status: 'WARNING',
    message: 'bad line',
    call_file: 'someFile',
    call_line: 3,
    ...overrides
  })

beforeEach(() => {
  vi.resetAllMocks()
})

describe('deleteStoredSelfLogsDuplicate', () => {
  it('should delete the stored lines with the same callFile, callLine and message as a self log', async () => {
    const duplicateLine = rawSelfLogLine()
    const duplicateLineOfAnotherJob = rawSelfLogLine({ job_id: 2, status: 'ERROR' })
    const secondDuplicateLine = rawSelfLogLine({ message: 'second', call_line: 7 })
    selfFileLogApi.getRawSelfLogLines.mockResolvedValueOnce([
      duplicateLine,
      rawSelfLogLine({ message: 'other' }),
      duplicateLineOfAnotherJob,
      rawSelfLogLine({ call_line: 9 }),
      rawSelfLogLine({ call_file: 'otherFile' }),
      secondDuplicateLine
    ])

    await deleteStoredSelfLogsDuplicate(selfFileLogApi, SELF_LOG_FILE_NAME, [
      selfLog(),
      selfLog({ message: 'second', callLine: 7 })
    ])

    expect(selfFileLogApi.getRawSelfLogLines).toHaveBeenCalledWith(SELF_LOG_FILE_NAME)
    expect(selfFileLogApi.deleteRawSelfLogLines).toHaveBeenCalledWith(SELF_LOG_FILE_NAME, [
      duplicateLine,
      duplicateLineOfAnotherJob,
      secondDuplicateLine
    ])
  })

  it('should never delete the stored lines that hold no self log', async () => {
    selfFileLogApi.getRawSelfLogLines.mockResolvedValueOnce([
      'not json',
      rawSelfLogLine({ call_file: undefined, call_line: undefined })
    ])

    await deleteStoredSelfLogsDuplicate(selfFileLogApi, SELF_LOG_FILE_NAME, [selfLog()])

    expect(selfFileLogApi.deleteRawSelfLogLines).toHaveBeenCalledWith(SELF_LOG_FILE_NAME, [])
  })
})

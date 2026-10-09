import type { Log } from '@echo/utilities'
import { describe, expect, it } from 'vitest'

import { buildNotifierMessage, formatLogLine } from '../buildNotifierMessage.js'

const MESSAGE_SIZE_LIMIT = 4096

const buildMessage = (
  problemLogs: Log[],
  messageSizeLimit = MESSAGE_SIZE_LIMIT
): string | undefined =>
  buildNotifierMessage({ messageSizeLimit, problemLogs, serverName: 'my-device', timezone: 'UTC' })

function mockLog(overrides: Partial<Log> = {}): Log {
  return {
    id: 'log-1',
    jobId: 1,
    date: '2026-01-01T10:00:00.000Z',
    category: 'ERROR',
    location: '/logs/worker.jsonl',
    locationName: 'worker',
    message: 'Something broke',
    callFile: 'worker.sh',
    callLine: 1,
    ...overrides
  }
}

describe('formatLogLine', () => {
  it('should format a log with its UTC date and a UTC label', () => {
    const result = formatLogLine(mockLog(), 'UTC')

    expect(result).toBe('[1] [2026-01-01 10:00:00 UTC] [ERROR] - worker > Something broke')
  })

  it('should shift the date and label it with the offset of a fixed-offset timezone', () => {
    const result = formatLogLine(mockLog(), 'UTC+2')

    expect(result).toBe('[1] [2026-01-01 12:00:00 UTC+2] [ERROR] - worker > Something broke')
  })

  it('should use the offset an IANA timezone has at the date of the log', () => {
    // Europe/Paris is UTC+1 in winter and UTC+2 in summer
    const winter = formatLogLine(mockLog({ date: '2026-01-01T10:00:00.000Z' }), 'Europe/Paris')
    const summer = formatLogLine(mockLog({ date: '2026-07-01T10:00:00.000Z' }), 'Europe/Paris')

    expect(winter).toContain('[2026-01-01 11:00:00 UTC+1]')
    expect(summer).toContain('[2026-07-01 12:00:00 UTC+2]')
  })

  it('should show minutes in the label of a non-whole-hour offset', () => {
    const result = formatLogLine(mockLog(), 'UTC-3:30')

    expect(result).toContain('[2026-01-01 06:30:00 UTC-3:30]')
  })
})

describe('buildNotifierMessage', () => {
  it('should return undefined when there are no logs', () => {
    expect(buildMessage([])).toBeUndefined()
  })

  it('should include a single log line under the size limit', () => {
    const result = buildMessage([mockLog()])

    expect(result).toBe(
      'Logs from device my-device:\n\n\n[1] [2026-01-01 10:00:00 UTC] [ERROR] - worker > Something broke'
    )
  })

  it('should include multiple logs separated by double newlines when all fit', () => {
    const logs = [mockLog({ jobId: 1 }), mockLog({ jobId: 2 })]
    const result = buildMessage(logs)

    expect(result).toBe(
      'Logs from device my-device:\n\n\n' +
        '[1] [2026-01-01 10:00:00 UTC] [ERROR] - worker > Something broke\n\n' +
        '[2] [2026-01-01 10:00:00 UTC] [ERROR] - worker > Something broke'
    )
  })

  it('should replace the logs that do not fit by a footer counting them', () => {
    const smallLog = mockLog({ jobId: 1, message: 'short' })
    const hugeLog = mockLog({ jobId: 2, message: 'x'.repeat(5000) })

    const result = buildMessage([smallLog, hugeLog, smallLog])

    expect(result).toBe(
      'Logs from device my-device:\n\n\n' +
        '[1] [2026-01-01 10:00:00 UTC] [ERROR] - worker > short' +
        '\n\n\n2 other logs to see inside the console'
    )
  })

  it('should list the logs that fit exactly in the size limit', () => {
    const logs = [mockLog({ jobId: 1 }), mockLog({ jobId: 2 })]
    const allLogsMessage = buildMessage(logs)!

    expect(buildMessage(logs, allLogsMessage.length)).toBe(allLogsMessage)
    expect(buildMessage(logs, allLogsMessage.length - 1)).toContain(
      '1 other logs to see inside the console'
    )
  })

  it('should only count the logs when not even the first one fits', () => {
    const logs = [mockLog({ jobId: 1 }), mockLog({ jobId: 2 })]

    expect(buildMessage(logs, 60)).toBe('2 logs from device my-device to see inside the console')
  })

  it('should return undefined when the size limit is too small for any message', () => {
    const logs = [mockLog({ jobId: 1 }), mockLog({ jobId: 2 })]
    const shortestMessage = '2 logs from device my-device to see inside the console'

    expect(buildMessage(logs, shortestMessage.length)).toBe(shortestMessage)
    expect(buildMessage(logs, shortestMessage.length - 1)).toBeUndefined()
  })

  it('should never build a message longer than the size limit', () => {
    const logs = [mockLog({ jobId: 1 }), mockLog({ jobId: 2 }), mockLog({ jobId: 3 })]

    for (let messageSizeLimit = 0; messageSizeLimit <= 300; messageSizeLimit++) {
      const result = buildMessage(logs, messageSizeLimit)

      expect(result?.length ?? 0).toBeLessThanOrEqual(messageSizeLimit)
    }
  })
})

import type { Log } from '@echo/utilities'
import { describe, expect, it } from 'vitest'

import { buildNotifierMessage, formatLogLine } from '../buildNotifierMessage.js'

const MESSAGE_SIZE_LIMIT = 4096

const buildMessage = (watchedLogs: Log[], messageSizeLimit = MESSAGE_SIZE_LIMIT): string =>
  buildNotifierMessage({ messageSizeLimit, watchedLogs, serverName: 'my-device', timezone: 'UTC' })

function mockLog(overrides: Partial<Log> = {}): Log {
  return {
    id: 'log-id',
    jobId: 1,
    date: '2026-01-01T10:00:00.000Z',
    level: 'ERROR',
    location: '/server/logs/worker.jsonl',
    locationName: 'worker',
    message: 'Something broke',
    origin: '/server/worker.sh:12',
    ...overrides
  }
}

describe('formatLogLine', () => {
  it('Should use the offset an IANA timezone has at the date of the log', () => {
    // Europe/Paris is UTC+1 in winter and UTC+2 in summer
    const winter = formatLogLine(mockLog({ date: '2026-01-01T10:00:00.000Z' }), 'Europe/Paris')
    const summer = formatLogLine(mockLog({ date: '2026-07-01T10:00:00.000Z' }), 'Europe/Paris')

    expect(winter).toContain('[2026-01-01 11:00:00 UTC+1]')
    expect(summer).toContain('[2026-07-01 12:00:00 UTC+2]')
  })

  it('Should show minutes in the label of a non-whole-hour offset', () => {
    const result = formatLogLine(mockLog(), 'UTC-3:30')

    expect(result).toContain('[2026-01-01 06:30:00 UTC-3:30]')
  })
})

describe('buildNotifierMessage', () => {
  it('Should only count the logs when there are none', () => {
    expect(buildMessage([])).toBe('0 logs from device my-device to see inside the app')
  })

  it('Should replace the logs that do not fit by a footer counting them', () => {
    const smallLog = mockLog({ jobId: 1, message: 'short' })
    const hugeLog = mockLog({ jobId: 2, message: 'x'.repeat(5000) })

    const result = buildMessage([smallLog, hugeLog, smallLog])

    expect(result).toBe(
      'Logs from device my-device:\n\n\n' +
        '[1] [2026-01-01 10:00:00 UTC] [ERROR] - worker > short' +
        '\n\n\n2 other logs to see inside the app'
    )
  })

  it('Should list the logs that fit exactly in the size limit', () => {
    const logs = [mockLog({ jobId: 1 }), mockLog({ jobId: 2 })]
    const allLogsMessage = buildMessage(logs)

    expect(buildMessage(logs, allLogsMessage.length)).toBe(allLogsMessage)
    expect(buildMessage(logs, allLogsMessage.length - 1)).toContain(
      '1 other logs to see inside the app'
    )
  })

  it('Should only count the logs when not even the first one fits', () => {
    const logs = [mockLog({ jobId: 1 }), mockLog({ jobId: 2 })]

    expect(buildMessage(logs, 60)).toBe('2 logs from device my-device to see inside the app')
  })

  it('Should never build a message longer than the size limit', () => {
    const logs = [mockLog({ jobId: 1 }), mockLog({ jobId: 2 }), mockLog({ jobId: 3 })]

    const shortestMessage = '3 logs from device my-device to see inside the app'

    for (
      let messageSizeLimit = shortestMessage.length;
      messageSizeLimit <= 300;
      messageSizeLimit++
    ) {
      expect(buildMessage(logs, messageSizeLimit).length).toBeLessThanOrEqual(messageSizeLimit)
    }
  })
})

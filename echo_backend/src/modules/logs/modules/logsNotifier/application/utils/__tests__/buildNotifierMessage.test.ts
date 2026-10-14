import type { Log } from '@echo/utilities'
import { describe, expect, it } from 'vitest'

import { buildNotifierMessage } from '../buildNotifierMessage.js'

const MESSAGE_SIZE_LIMIT = 4096

const buildMessage = (
  watchedLogs: Log[],
  { messageSizeLimit = MESSAGE_SIZE_LIMIT, timezone = 'UTC' } = {}
): string =>
  buildNotifierMessage({ messageSizeLimit, watchedLogs, serverName: 'my-server', timezone })

const mockLog = (overrides: Partial<Log> = {}): Log => ({
  id: 'log-id',
  jobId: 1,
  date: '2026-01-01T10:00:00.000Z',
  level: 'ERROR',
  location: '/server/logs/worker.jsonl',
  locationName: 'worker',
  message: 'Something broke',
  origin: '/server/worker.sh:12',
  ...overrides
})

describe('buildNotifierMessage', () => {
  it('Should show the dates with the offset an IANA timezone has at the date of each log', () => {
    // Europe/Paris is UTC+1 in winter and UTC+2 in summer
    const message = buildMessage(
      [
        mockLog({ date: '2026-01-01T10:00:00.000Z' }),
        mockLog({ date: '2026-07-01T10:00:00.000Z' })
      ],
      { timezone: 'Europe/Paris' }
    )

    expect(message).toContain('[2026-01-01 11:00:00 UTC+1]')
    expect(message).toContain('[2026-07-01 12:00:00 UTC+2]')
  })

  it('Should show the minutes of an offset that is not a whole hour', () => {
    expect(buildMessage([mockLog()], { timezone: 'UTC-3:30' })).toContain(
      '[2026-01-01 06:30:00 UTC-3:30]'
    )
  })

  it('Should replace the logs that do not fit by a footer counting them', () => {
    const smallLog = mockLog({ jobId: 1, message: 'short' })
    const hugeLog = mockLog({ jobId: 2, message: 'x'.repeat(5000) })

    const message = buildMessage([smallLog, hugeLog, smallLog])

    expect(message).toBe(
      'Logs from server my-server:\n\n\n' +
        '[1] [2026-01-01 10:00:00 UTC] [ERROR] - worker > short' +
        '\n\n\n2 other logs to see inside the app'
    )
  })

  it('Should list the logs that fit exactly in the size limit, and count a single other log as one', () => {
    const logs = [mockLog({ jobId: 1 }), mockLog({ jobId: 2 })]
    const allLogsMessage = buildMessage(logs)

    expect(buildMessage(logs, { messageSizeLimit: allLogsMessage.length })).toBe(allLogsMessage)
    expect(buildMessage(logs, { messageSizeLimit: allLogsMessage.length - 1 })).toMatch(
      /\n\n\n1 other log to see inside the app$/
    )
  })

  it.each([
    { logsCount: 1, message: '1 log from server my-server to see inside the app' },
    { logsCount: 2, message: '2 logs from server my-server to see inside the app' }
  ])(
    'Should only count the logs when not even the first one fits ($logsCount)',
    ({ logsCount, message }) => {
      const logs = Array.from({ length: logsCount }, (_, index) => mockLog({ jobId: index }))

      expect(buildMessage(logs, { messageSizeLimit: 60 })).toBe(message)
    }
  )

  it('Should never build a message longer than the size limit', () => {
    const logs = [mockLog({ jobId: 1 }), mockLog({ jobId: 2 }), mockLog({ jobId: 3 })]

    const shortestMessage = '3 logs from server my-server to see inside the app'

    for (
      let messageSizeLimit = shortestMessage.length;
      messageSizeLimit <= 300;
      messageSizeLimit++
    ) {
      expect(buildMessage(logs, { messageSizeLimit }).length).toBeLessThanOrEqual(messageSizeLimit)
    }
  })
})

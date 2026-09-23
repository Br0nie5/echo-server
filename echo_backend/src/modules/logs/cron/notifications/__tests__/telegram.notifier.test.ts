import type { Log } from '@echo/utilities'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LogsCronOptions } from '../../../../../shared/types/echoBackEnv.js'
import {
  buildTelegramMessage,
  createTelegramNotifier,
  formatLogLine
} from '../telegram.notifier.js'

function mockLog(overrides: Partial<Log> = {}): Log {
  return {
    id: 'log-1',
    jobId: 1,
    date: '2026-01-01T10:00:00.000Z',
    category: 'ERROR',
    fileName: 'worker.ts',
    message: 'Something broke',
    ...overrides
  }
}

function mockLogsCronOptions(overrides: Partial<LogsCronOptions> = {}): LogsCronOptions {
  return {
    LOGS_CRON_SCHEDULE_REGEX: '*/30 * * * *',
    WATCHED_LOGS_CATEGORIES: ['ERROR', 'WARNING'],
    TELEGRAM_CHAT_ID: 'chat-123',
    TELEGRAM_BASE_URL: 'https://api.telegram.org/bot-fake',
    TELEGRAM_TIMEZONE: 'UTC',
    ...overrides
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('formatLogLine', () => {
  it('should format a log with its UTC date and a UTC label', () => {
    const result = formatLogLine(mockLog(), 'UTC')

    expect(result).toBe('[1] [2026-01-01 10:00:00 UTC] [ERROR] - worker.ts > Something broke')
  })

  it('should shift the date and label it with the offset of a fixed-offset timezone', () => {
    const result = formatLogLine(mockLog(), 'UTC+2')

    expect(result).toBe('[1] [2026-01-01 12:00:00 UTC+2] [ERROR] - worker.ts > Something broke')
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

describe('buildTelegramMessage', () => {
  it('should return just the header when there are no logs', () => {
    const result = buildTelegramMessage([], 'my-device', 'UTC')

    expect(result).toBe('Logs from device my-device:\n\n\n')
  })

  it('should include a single log line under the character limit', () => {
    const result = buildTelegramMessage([mockLog()], 'my-device', 'UTC')

    expect(result).toBe(
      'Logs from device my-device:\n\n\n[1] [2026-01-01 10:00:00 UTC] [ERROR] - worker.ts > Something broke'
    )
  })

  it('should include multiple logs separated by double newlines when all fit', () => {
    const logs = [mockLog({ jobId: 1 }), mockLog({ jobId: 2 })]
    const result = buildTelegramMessage(logs, 'my-device', 'UTC')

    expect(result).toContain('[1] [2026-01-01')
    expect(result).toContain('[2] [2026-01-01')
    expect(result).toMatch(/\[1\].*\n\n\[2\]/s)
  })

  it('should truncate and append a footer when a log would exceed the Telegram limit', () => {
    const smallLog = mockLog({ jobId: 1, message: 'short' })
    const hugeLog = mockLog({ jobId: 2, message: 'x'.repeat(5000) })

    const result = buildTelegramMessage([smallLog, hugeLog], 'my-device', 'UTC')

    expect(result).toContain('[1] [2026-01-01')
    expect(result).not.toContain('[2] [2026-01-01')
    expect(result).toContain('1 other logs to see inside the console')
    expect(result.length).toBeLessThanOrEqual(4096 + 100) // footer pushes it slightly, sanity bound
  })
})

describe('createTelegramNotifier', () => {
  const notify = (logs: Log[], options = mockLogsCronOptions()): Promise<void> =>
    createTelegramNotifier(options, 'test-device').notify(logs)

  it('should do nothing when there are no problem logs', async () => {
    await notify([])

    expect(fetch).not.toHaveBeenCalled()
  })

  it('should send a POST request with the built message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response)

    const options = mockLogsCronOptions()
    await notify([mockLog()], options)

    expect(fetch).toHaveBeenCalledWith(
      `${options.TELEGRAM_BASE_URL}/sendMessage`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining(options.TELEGRAM_CHAT_ID)
      })
    )

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.text).toContain('test-device')
  })

  it('should throw when the Telegram API responds with a non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response)

    await expect(notify([mockLog()])).rejects.toThrow('Telegram API error: 500')
  })
})

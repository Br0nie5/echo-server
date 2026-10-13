import type { Log, LogLevel } from '@echo/utilities'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { NotificationsService } from '../../../../../notifications/domain/notifications.service.js'
import { checkWatchedLogsAndNotify, type WatchedLogsCheck } from '../checkWatchedLogsAndNotify.js'

const log: Log = {
  id: 'log-id',
  jobId: 1,
  date: '2026-01-01T10:00:00.000Z',
  level: 'ERROR',
  location: '/server/logs/worker.jsonl',
  locationName: 'worker',
  message: 'Something broke',
  origin: '/server/worker.sh:12'
}

const markAsNotified = vi.fn()
const unNotifiedLogsRepository = { getUnNotifiedLogs: vi.fn() }
const notificationsService = { notify: vi.fn<NotificationsService['notify']>() }
const WATCHED = ['ERROR', 'WARNING'] as LogLevel[]
/** When the check being tested runs. */
const CHECK_DATE = new Date('2026-01-01T00:30:00.000Z')

const watchedLogsCheck: WatchedLogsCheck = {
  logsNotifierConfig: {
    schedule: '*/30 * * * *',
    watchedLogsLevels: WATCHED,
    timezone: 'UTC+2',
    serverName: 'test-device'
  },
  unNotifiedLogsRepository,
  notificationsService
}

const check = (): Promise<void> => checkWatchedLogsAndNotify(watchedLogsCheck)

const mockUnNotifiedLogs = (logs: Log[]): void => {
  unNotifiedLogsRepository.getUnNotifiedLogs.mockResolvedValueOnce({ logs, markAsNotified })
}

/** The message the check gave `notificationsService` to send, built for `messageSizeLimit`. */
const buildNotifiedMessage = (messageSizeLimit: number): string => {
  const [[buildMessage]] = notificationsService.notify.mock.calls

  return buildMessage(messageSizeLimit)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(CHECK_DATE)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('checkWatchedLogsAndNotify', () => {
  it('Should notify the unNotified logs of a watched level, from the newest to the oldest', async () => {
    const olderWarningLog: Log = {
      ...log,
      id: 'older-warning-log-id',
      date: '2026-01-01T09:00:00.000Z',
      level: 'WARNING',
      message: 'Something is slow'
    }
    const unwatchedInfoLog: Log = {
      ...log,
      id: 'info-log-id',
      level: 'INFO',
      message: 'Something started'
    }
    mockUnNotifiedLogs([olderWarningLog, unwatchedInfoLog, log])

    await check()

    expect(notificationsService.notify).toHaveBeenCalledOnce()
    expect(buildNotifiedMessage(4096)).toBe(
      'Logs from device test-device:\n\n\n' +
        '[1] [2026-01-01 12:00:00 UTC+2] [ERROR] - worker > Something broke\n\n' +
        '[1] [2026-01-01 11:00:00 UTC+2] [WARNING] - worker > Something is slow'
    )
    expect(markAsNotified).toHaveBeenCalledOnce()
  })

  it('Should notify a message within the size limit of the notifier', async () => {
    mockUnNotifiedLogs([log, log])

    await check()

    expect(buildNotifiedMessage(60)).toBe('2 logs from device test-device to see inside the app')
  })

  it('Should not notify when no watched logs are found, and still mark the logs as notified', async () => {
    mockUnNotifiedLogs([])

    await check()

    expect(notificationsService.notify).not.toHaveBeenCalled()
    expect(markAsNotified).toHaveBeenCalledOnce()
  })

  it('Should not mark the logs as notified when notifying fails', async () => {
    mockUnNotifiedLogs([log])
    notificationsService.notify.mockRejectedValueOnce(new Error('Telegram down'))

    await expect(check()).rejects.toThrow('Telegram down')

    expect(markAsNotified).not.toHaveBeenCalled()
  })
})

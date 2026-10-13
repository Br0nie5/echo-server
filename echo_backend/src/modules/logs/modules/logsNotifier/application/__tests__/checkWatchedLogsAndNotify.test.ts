import type { Log, LogLevel } from '@echo/utilities'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
const notificationsService = { getMessageSizeLimit: vi.fn(), notify: vi.fn() }
const logsNotifierSelfReportRepository = { saveSelfReports: vi.fn(), getAllSelfReports: vi.fn() }
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
  notificationsService,
  logsNotifierSelfReportRepository
}

const check = (): Promise<void> => checkWatchedLogsAndNotify(watchedLogsCheck)

const mockUnNotifiedLogs = (logs: Log[]): void => {
  unNotifiedLogsRepository.getUnNotifiedLogs.mockResolvedValueOnce({ logs, markAsNotified })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(CHECK_DATE)
  notificationsService.getMessageSizeLimit.mockReturnValue(4096)
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

    expect(notificationsService.notify).toHaveBeenCalledWith(
      'Logs from device test-device:\n\n\n' +
        '[1] [2026-01-01 12:00:00 UTC+2] [ERROR] - worker > Something broke\n\n' +
        '[1] [2026-01-01 11:00:00 UTC+2] [WARNING] - worker > Something is slow'
    )
    expect(logsNotifierSelfReportRepository.saveSelfReports).not.toHaveBeenCalled()
    expect(markAsNotified).toHaveBeenCalledOnce()
  })

  it('Should notify a message within the size limit of the notifier', async () => {
    mockUnNotifiedLogs([log, log])
    notificationsService.getMessageSizeLimit.mockReturnValue(60)

    await check()

    expect(notificationsService.notify).toHaveBeenCalledWith(
      '2 logs from device test-device to see inside the console'
    )
    expect(logsNotifierSelfReportRepository.saveSelfReports).not.toHaveBeenCalled()
  })

  it('Should notify nothing, save a warning self report and still mark the logs as notified when the size limit is too small for any message', async () => {
    mockUnNotifiedLogs([log])
    notificationsService.getMessageSizeLimit.mockReturnValue(10)

    await check()

    expect(notificationsService.notify).not.toHaveBeenCalled()
    expect(logsNotifierSelfReportRepository.saveSelfReports).toHaveBeenCalledWith([
      {
        date: CHECK_DATE,
        message:
          'The watched logs were not notified: the notifier takes messages of 10 characters at most, which is not enough for any message',
        level: 'WARNING',
        origin: 'checkWatchedLogsAndNotify'
      }
    ])
    expect(markAsNotified).toHaveBeenCalledOnce()
  })

  it('Should notify nothing and still mark the logs as notified when the size limit is too small and the self reports are disabled', async () => {
    mockUnNotifiedLogs([log])
    notificationsService.getMessageSizeLimit.mockReturnValue(10)

    await checkWatchedLogsAndNotify({
      ...watchedLogsCheck,
      logsNotifierSelfReportRepository: undefined
    })

    expect(notificationsService.notify).not.toHaveBeenCalled()
    expect(markAsNotified).toHaveBeenCalledOnce()
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

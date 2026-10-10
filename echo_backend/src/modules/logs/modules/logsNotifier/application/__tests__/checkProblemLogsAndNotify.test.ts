import type { Log, LogCategory } from '@echo/utilities'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../application/getFilteredLogs.js')

import { getFilteredLogs as actualGetFilteredLogs } from '../../../../application/getFilteredLogs.js'
import { checkProblemLogsAndNotify } from '../checkProblemLogsAndNotify.js'

const log: Log = {
  id: 'log-1',
  jobId: 1,
  date: '2026-01-01T10:00:00.000Z',
  category: 'ERROR',
  location: '/logs/worker.jsonl',
  locationName: 'worker',
  message: 'Something broke',
  callFile: 'worker.sh',
  callLine: 1
}

const getFilteredLogs = vi.mocked(actualGetFilteredLogs)
const logsRepository = {
  getAllLogs: vi.fn(),
  getLogs: vi.fn(),
  saveLogs: vi.fn(),
  deleteLogs: vi.fn()
}
const logsSelfReportRepository = { saveSelfReports: vi.fn() }
const notifierService = { getMessageSizeLimit: vi.fn(), notify: vi.fn() }
const checkDateRepository = { getLastCheckDate: vi.fn(), saveLastCheckDate: vi.fn() }
const selfReportRepository = { saveSelfReports: vi.fn() }
const WATCHED = ['ERROR', 'WARNING'] as LogCategory[]
const PREVIOUS_CHECK = { lastCheckDate: new Date('2026-01-01T00:00:00.000Z') }
/** When the check being tested runs: it looks at the logs from `PREVIOUS_CHECK` up to it. */
const CHECK_DATE = new Date('2026-01-01T00:30:00.000Z')

const check = (): Promise<void> =>
  checkProblemLogsAndNotify({
    watchedLogsCategories: WATCHED,
    serverName: 'test-device',
    timezone: 'UTC+2',
    logsRepository,
    logsSelfReportRepository,
    notifierService,
    checkDateRepository,
    selfReportRepository
  })

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(CHECK_DATE)
  notifierService.getMessageSizeLimit.mockReturnValue(4096)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('checkProblemLogsAndNotify', () => {
  it('should save the date and skip checking/notifying on the first check (no date stored)', async () => {
    checkDateRepository.getLastCheckDate.mockResolvedValueOnce(undefined)

    await check()

    expect(getFilteredLogs).not.toHaveBeenCalled()
    expect(notifierService.notify).not.toHaveBeenCalled()
    expect(checkDateRepository.saveLastCheckDate).toHaveBeenCalledExactlyOnceWith({
      lastCheckDate: CHECK_DATE
    })
  })

  it('should notify the problem logs logged since the previous check', async () => {
    checkDateRepository.getLastCheckDate.mockResolvedValueOnce(PREVIOUS_CHECK)
    getFilteredLogs.mockResolvedValueOnce([log])

    await check()

    expect(getFilteredLogs).toHaveBeenCalledWith(logsRepository, logsSelfReportRepository, {
      fromDate: PREVIOUS_CHECK.lastCheckDate,
      toDate: CHECK_DATE,
      categories: WATCHED,
      searchFilters: []
    })
    expect(notifierService.notify).toHaveBeenCalledWith(
      'Logs from device test-device:\n\n\n[1] [2026-01-01 12:00:00 UTC+2] [ERROR] - worker > Something broke'
    )
    expect(selfReportRepository.saveSelfReports).not.toHaveBeenCalled()
    expect(checkDateRepository.saveLastCheckDate).toHaveBeenCalledExactlyOnceWith({
      lastCheckDate: CHECK_DATE
    })
  })

  it('should notify a message within the size limit of the notifier', async () => {
    checkDateRepository.getLastCheckDate.mockResolvedValueOnce(PREVIOUS_CHECK)
    getFilteredLogs.mockResolvedValueOnce([log, log])
    notifierService.getMessageSizeLimit.mockReturnValue(60)

    await check()

    expect(notifierService.notify).toHaveBeenCalledWith(
      '2 logs from device test-device to see inside the console'
    )
    expect(selfReportRepository.saveSelfReports).not.toHaveBeenCalled()
  })

  it('should notify nothing, save a warning self report and still save the date when the size limit is too small for any message', async () => {
    checkDateRepository.getLastCheckDate.mockResolvedValueOnce(PREVIOUS_CHECK)
    getFilteredLogs.mockResolvedValueOnce([log])
    notifierService.getMessageSizeLimit.mockReturnValue(10)

    await check()

    expect(notifierService.notify).not.toHaveBeenCalled()
    expect(selfReportRepository.saveSelfReports).toHaveBeenCalledWith([
      {
        date: CHECK_DATE,
        message:
          'The problem logs were not notified: the notifier takes messages of 10 characters at most, which is not enough for any message',
        level: 'warning',
        reportedFile: 'checkProblemLogsAndNotify'
      }
    ])
    expect(checkDateRepository.saveLastCheckDate).toHaveBeenCalledExactlyOnceWith({
      lastCheckDate: CHECK_DATE
    })
  })

  it('should not notify when no problem logs are found, and still save the date', async () => {
    checkDateRepository.getLastCheckDate.mockResolvedValueOnce(PREVIOUS_CHECK)
    getFilteredLogs.mockResolvedValueOnce([])

    await check()

    expect(notifierService.notify).not.toHaveBeenCalled()
    expect(checkDateRepository.saveLastCheckDate).toHaveBeenCalledExactlyOnceWith({
      lastCheckDate: CHECK_DATE
    })
  })

  it('should not save the date when notifying fails', async () => {
    checkDateRepository.getLastCheckDate.mockResolvedValueOnce(PREVIOUS_CHECK)
    getFilteredLogs.mockResolvedValueOnce([log])
    notifierService.notify.mockRejectedValueOnce(new Error('Telegram down'))

    await expect(check()).rejects.toThrow('Telegram down')

    expect(checkDateRepository.saveLastCheckDate).not.toHaveBeenCalled()
  })
})

import type { Log, LogCategory } from '@echo/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../application/getFilteredLogs.js')

import { getFilteredLogs as actualGetFilteredLogs } from '../../../../application/getFilteredLogs.js'
import { checkProblemLogsAndNotify } from '../checkProblemLogsAndNotify.js'

const log: Log = {
  id: 'log-1',
  jobId: 1,
  date: '2026-01-01T10:00:00.000Z',
  category: 'ERROR',
  fileName: 'worker',
  message: 'Something broke',
  callFile: 'worker.sh',
  callLine: 1
}

const getFilteredLogs = vi.mocked(actualGetFilteredLogs)
const logsRepository = { findAllLogs: vi.fn() }
const notifier = { getMessageSizeLimit: vi.fn(), notify: vi.fn() }
const checkDateRepository = { getLastCheckDate: vi.fn(), saveLastCheckDate: vi.fn() }
const selfReportRepository = { saveSelfReports: vi.fn() }
const WATCHED = ['ERROR', 'WARNING'] as LogCategory[]
const PREVIOUS_CHECK = { lastCheckDate: new Date('2026-01-01T00:00:00.000Z') }

const check = (): Promise<void> =>
  checkProblemLogsAndNotify({
    watchedLogsCategories: WATCHED,
    serverName: 'test-device',
    timezone: 'UTC+2',
    logsRepository,
    notifier,
    checkDateRepository,
    selfReportRepository
  })

beforeEach(() => {
  vi.clearAllMocks()
  notifier.getMessageSizeLimit.mockReturnValue(4096)
})

describe('checkProblemLogsAndNotify', () => {
  it('should save the date and skip checking/notifying on the first check (no date stored)', async () => {
    checkDateRepository.getLastCheckDate.mockResolvedValueOnce(undefined)

    await check()

    expect(getFilteredLogs).not.toHaveBeenCalled()
    expect(notifier.notify).not.toHaveBeenCalled()
    expect(checkDateRepository.saveLastCheckDate).toHaveBeenCalledTimes(1)
    expect(checkDateRepository.saveLastCheckDate).toHaveBeenCalledWith({
      lastCheckDate: expect.any(Date)
    })
  })

  it('should notify the problem logs logged since the previous check', async () => {
    checkDateRepository.getLastCheckDate.mockResolvedValueOnce(PREVIOUS_CHECK)
    getFilteredLogs.mockResolvedValueOnce([log])

    await check()

    expect(getFilteredLogs).toHaveBeenCalledWith(logsRepository, {
      fromDate: PREVIOUS_CHECK.lastCheckDate,
      categories: WATCHED,
      searchFilters: []
    })
    expect(notifier.notify).toHaveBeenCalledWith(
      'Logs from device test-device:\n\n\n[1] [2026-01-01 12:00:00 UTC+2] [ERROR] - worker > Something broke'
    )
    expect(selfReportRepository.saveSelfReports).not.toHaveBeenCalled()
    expect(checkDateRepository.saveLastCheckDate).toHaveBeenCalledTimes(1)
  })

  it('should notify a message within the size limit of the notifier', async () => {
    checkDateRepository.getLastCheckDate.mockResolvedValueOnce(PREVIOUS_CHECK)
    getFilteredLogs.mockResolvedValueOnce([log, log])
    notifier.getMessageSizeLimit.mockReturnValue(60)

    await check()

    expect(notifier.notify).toHaveBeenCalledWith(
      '2 logs from device test-device to see inside the console'
    )
    expect(selfReportRepository.saveSelfReports).not.toHaveBeenCalled()
  })

  it('should notify nothing, save a warning self report and still save the date when the size limit is too small for any message', async () => {
    checkDateRepository.getLastCheckDate.mockResolvedValueOnce(PREVIOUS_CHECK)
    getFilteredLogs.mockResolvedValueOnce([log])
    notifier.getMessageSizeLimit.mockReturnValue(10)

    await check()

    expect(notifier.notify).not.toHaveBeenCalled()
    expect(selfReportRepository.saveSelfReports).toHaveBeenCalledWith([
      {
        date: expect.any(Date),
        message:
          'The problem logs were not notified: the notifier takes messages of 10 characters at most, which is not enough for any message',
        level: 'warning',
        reportedFile: 'checkProblemLogsAndNotify',
        reportedLine: 0
      }
    ])
    expect(checkDateRepository.saveLastCheckDate).toHaveBeenCalledTimes(1)
  })

  it('should not notify when no problem logs are found, and still save the date', async () => {
    checkDateRepository.getLastCheckDate.mockResolvedValueOnce(PREVIOUS_CHECK)
    getFilteredLogs.mockResolvedValueOnce([])

    await check()

    expect(notifier.notify).not.toHaveBeenCalled()
    expect(checkDateRepository.saveLastCheckDate).toHaveBeenCalledTimes(1)
  })

  it('should not save the date when notifying fails', async () => {
    checkDateRepository.getLastCheckDate.mockResolvedValueOnce(PREVIOUS_CHECK)
    getFilteredLogs.mockResolvedValueOnce([log])
    notifier.notify.mockRejectedValueOnce(new Error('Telegram down'))

    await expect(check()).rejects.toThrow('Telegram down')

    expect(checkDateRepository.saveLastCheckDate).not.toHaveBeenCalled()
  })
})

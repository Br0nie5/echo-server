import type { Log } from '@echo/utilities'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LogsRepository } from '../../../../domain/logs.repository.js'
import type { CheckDateApi } from '../checkDateFile.api.js'
import { createUnNotifiedLogsCheckDateRepository } from '../unNotifiedLogsCheckDate.repository.js'

const LAST_CHECK = new Date('2026-11-16T03:55:00.000Z')
/** The date the clock of a machine without a hardware clock gives right after it boots. */
const CLOCK_BEHIND_AT_BOOT = new Date('2026-10-12T07:00:20.000Z')
const CHECK_ONCE_CLOCK_SYNCED = new Date('2026-11-16T04:05:00.000Z')

const toLastCheckFileContent = (lastCheck: Date): string =>
  JSON.stringify({ lastCheck: lastCheck.toISOString() }, null, 2)

const buildLog = (date: string, message: string): Log => ({
  id: '0a1b2c3d4e5f60718293a4b5c6d7',
  date,
  location: '/logs/billing/logs/send_invoices.jsonl',
  locationName: 'send_invoices',
  groupName: 'billing',
  jobId: 7,
  level: 'ERROR',
  message
})

const logsRepository = { getAllLogs: vi.fn<LogsRepository['getAllLogs']>() }
const checkDateApi = {
  getRawLastCheckDate: vi.fn<CheckDateApi['getRawLastCheckDate']>(),
  saveRawLastCheckDate: vi.fn<CheckDateApi['saveRawLastCheckDate']>()
}

beforeEach(() => {
  vi.useFakeTimers()
  checkDateApi.getRawLastCheckDate.mockResolvedValue(toLastCheckFileContent(LAST_CHECK))
})

afterEach(() => {
  vi.useRealTimers()
  vi.resetAllMocks()
})

describe('createUnNotifiedLogsCheckDateRepository', () => {
  it('Should keep the last check date when the clock is behind it, then give the logs since it once the clock is right', async () => {
    const alreadyNotifiedLog = buildLog('2026-11-12T04:00:39.283Z', 'Invoices not sent.')
    const logSinceLastCheck = buildLog('2026-11-16T04:01:12.000Z', 'Invoice 42 not sent.')
    logsRepository.getAllLogs.mockResolvedValue([alreadyNotifiedLog, logSinceLastCheck])
    const repository = createUnNotifiedLogsCheckDateRepository(logsRepository, checkDateApi)

    vi.setSystemTime(CLOCK_BEHIND_AT_BOOT)
    const checkWithClockBehind = await repository.getUnNotifiedLogs()
    await checkWithClockBehind.markAsNotified()

    expect(checkWithClockBehind.logs).toEqual([])
    expect(checkDateApi.saveRawLastCheckDate).not.toHaveBeenCalled()

    vi.setSystemTime(CHECK_ONCE_CLOCK_SYNCED)
    const checkOnceClockSynced = await repository.getUnNotifiedLogs()
    await checkOnceClockSynced.markAsNotified()

    expect(checkOnceClockSynced.logs).toEqual([logSinceLastCheck])
    expect(checkDateApi.saveRawLastCheckDate).toHaveBeenCalledExactlyOnceWith(
      toLastCheckFileContent(CHECK_ONCE_CLOCK_SYNCED)
    )
  })
})

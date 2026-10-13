import type { Log } from '@echo/utilities'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createUnNotifiedLogsCheckDateRepository } from '../unNotifiedLogsCheckDate.repository.js'

const LAST_CHECK = new Date('2026-01-01T00:00:00.000Z')
/** When the read being tested runs: it gives the logs from `LAST_CHECK` up to it. */
const CHECK_DATE = new Date('2026-01-01T00:30:00.000Z')

const toRawLastCheckDate = (lastCheckDate: Date): string =>
  JSON.stringify({ lastCheck: lastCheckDate.toISOString() }, null, 2)

const buildLog = (id: string, date: string): Log => ({
  id,
  jobId: 1,
  date,
  level: 'ERROR',
  location: '/server/logs/worker.jsonl',
  locationName: 'worker',
  message: 'Something broke'
})

const logsRepository = { getAllLogs: vi.fn() }
const checkDateApi = {
  getRawLastCheckDate: vi.fn(),
  saveRawLastCheckDate: vi.fn()
}
const unNotifiedLogsRepository = createUnNotifiedLogsCheckDateRepository(
  logsRepository,
  checkDateApi
)

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(CHECK_DATE)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('UnNotifiedLogsCheckDateRepository', () => {
  describe('getUnNotifiedLogs', () => {
    it('Should give the logs logged from the last check to its own, the latter left out', async () => {
      const logBeforeLastCheck = buildLog('before-last-check', '2025-12-31T23:59:59.999Z')
      const logAtLastCheck = buildLog('at-last-check', '2026-01-01T00:00:00.000Z')
      const logSinceLastCheck = buildLog('since-last-check', '2026-01-01T00:29:59.999Z')
      const logAtCheck = buildLog('at-check', '2026-01-01T00:30:00.000Z')
      checkDateApi.getRawLastCheckDate.mockResolvedValueOnce(toRawLastCheckDate(LAST_CHECK))
      logsRepository.getAllLogs.mockResolvedValueOnce([
        logBeforeLastCheck,
        logAtLastCheck,
        logSinceLastCheck,
        logAtCheck
      ])

      const { logs } = await unNotifiedLogsRepository.getUnNotifiedLogs()

      expect(logs).toEqual([logAtLastCheck, logSinceLastCheck])
    })

    it.each([
      {
        fileState: 'cannot be read',
        mockLastCheckFile: (): unknown =>
          checkDateApi.getRawLastCheckDate.mockRejectedValueOnce(new Error('ENOENT'))
      },
      {
        fileState: 'holds no valid date',
        mockLastCheckFile: (): unknown =>
          checkDateApi.getRawLastCheckDate.mockResolvedValueOnce('not-json')
      }
    ])(
      'Should give every log logged before its own date when the last-check file $fileState',
      async ({ mockLastCheckFile }) => {
        const oldLog = buildLog('old', '2020-06-15T12:00:00.000Z')
        const logAtCheck = buildLog('at-check', '2026-01-01T00:30:00.000Z')
        mockLastCheckFile()
        logsRepository.getAllLogs.mockResolvedValueOnce([oldLog, logAtCheck])

        const { logs, markAsNotified } = await unNotifiedLogsRepository.getUnNotifiedLogs()
        await markAsNotified()

        expect(logs).toEqual([oldLog])
        expect(checkDateApi.saveRawLastCheckDate).toHaveBeenCalledExactlyOnceWith(
          toRawLastCheckDate(CHECK_DATE)
        )
      }
    )

    it('Should save nothing until its logs are marked as notified, then the date it read them at', async () => {
      const markDate = new Date('2026-01-01T00:30:05.000Z')
      checkDateApi.getRawLastCheckDate.mockResolvedValueOnce(toRawLastCheckDate(LAST_CHECK))
      logsRepository.getAllLogs.mockResolvedValueOnce([])

      const { markAsNotified } = await unNotifiedLogsRepository.getUnNotifiedLogs()

      expect(checkDateApi.saveRawLastCheckDate).not.toHaveBeenCalled()

      vi.setSystemTime(markDate)
      await markAsNotified()

      expect(checkDateApi.saveRawLastCheckDate).toHaveBeenCalledExactlyOnceWith(
        toRawLastCheckDate(CHECK_DATE)
      )
    })
  })
})

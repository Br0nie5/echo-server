import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createNotificationsTelegramService } from '../notificationsTelegram.service.js'

/** When the notification being tested is sent. */
const NOTIFICATION_DATE = new Date('2026-03-12T08:15:00.000Z')

const telegramOptions = {
  telegramChatId: 'chat-123',
  telegramBotToken: 'bot-token',
  telegramBaseUrl: 'https://telegram.test',
  telegramMessageSizeLimit: 120,
  telegramRequestTimeoutMilliseconds: 3000
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOTIFICATION_DATE)
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('createNotificationsTelegramService', () => {
  describe('notify', () => {
    // Without a timeout, a request Telegram never answers would hold the notifier, whose checks do
    // not overlap, for as long as Node.js waits. The tests of the notifier stub `fetch`, which
    // answers at once, so they cannot see it.
    it('Should give up a request to Telegram after telegramRequestTimeoutMilliseconds', async () => {
      const timeoutSignal = AbortSignal.abort()
      const createTimeoutSignal = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutSignal)
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }))

      await createNotificationsTelegramService(telegramOptions).notify(() => 'Hello')

      expect(createTimeoutSignal).toHaveBeenCalledExactlyOnceWith(3000)
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: timeoutSignal })
      )
    })

    it('Should throw the error of the network when Telegram cannot be reached', async () => {
      const networkError = new Error('Network down')
      vi.mocked(fetch).mockRejectedValueOnce(networkError)

      await expect(
        createNotificationsTelegramService(telegramOptions).notify(() => 'Hello')
      ).rejects.toBe(networkError)
    })

    it('Should save what was thrown as the text of its self report when it is not an error', async () => {
      const notificationsSelfReportRepository = {
        saveSelfReports: vi.fn(),
        getSelfReports: vi.fn()
      }
      vi.mocked(fetch).mockRejectedValueOnce('Network down')

      await expect(
        createNotificationsTelegramService(
          telegramOptions,
          notificationsSelfReportRepository
        ).notify(() => 'Hello')
      ).rejects.toBe('Network down')

      expect(notificationsSelfReportRepository.saveSelfReports).toHaveBeenCalledExactlyOnceWith([
        {
          date: NOTIFICATION_DATE,
          message: 'The notification was not sent: Network down',
          level: 'ERROR',
          origin: 'notificationsTelegramService'
        }
      ])
    })
  })
})

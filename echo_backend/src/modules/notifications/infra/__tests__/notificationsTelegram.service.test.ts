import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createNotificationsTelegramService } from '../notificationsTelegram.service.js'

/** When the notification being tested is sent. */
const NOTIFICATION_DATE = new Date('2026-03-12T08:15:00.000Z')

const telegramOptions = {
  telegramChatId: 'chat-123',
  telegramBotToken: 'bot-token',
  telegramBaseUrl: 'https://telegram.test',
  telegramMessageSizeLimit: 120
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOTIFICATION_DATE)
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('createNotificationsTelegramService', () => {
  describe('notify', () => {
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

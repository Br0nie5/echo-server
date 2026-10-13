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
const notificationsSelfReportRepository = { saveSelfReports: vi.fn(), getAllSelfReports: vi.fn() }

const notificationsService = createNotificationsTelegramService(
  telegramOptions,
  notificationsSelfReportRepository
)

beforeEach(() => {
  vi.clearAllMocks()
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
    it('Should post the message built for its size limit to the chat it was created with', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response)

      await notificationsService.notify(
        (messageSizeLimit) => `Hello in ${messageSizeLimit} characters`
      )

      expect(fetch).toHaveBeenCalledWith('https://telegram.test/botbot-token/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: 'chat-123', text: 'Hello in 120 characters' })
      })
      expect(notificationsSelfReportRepository.saveSelfReports).not.toHaveBeenCalled()
    })

    it('Should save an error self report and throw when the Telegram API responds with a non-ok status', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response)

      await expect(notificationsService.notify(() => 'Hello')).rejects.toThrow(
        'Telegram API error: 500'
      )

      expect(notificationsSelfReportRepository.saveSelfReports).toHaveBeenCalledExactlyOnceWith([
        {
          date: NOTIFICATION_DATE,
          message: 'The notification was not sent: Telegram API error: 500',
          level: 'ERROR',
          origin: 'notificationsTelegramService'
        }
      ])
    })

    it('Should save an error self report and throw what the message builder throws, without posting', async () => {
      const buildMessage = (): string => {
        throw 'Nothing fits'
      }

      await expect(notificationsService.notify(buildMessage)).rejects.toBe('Nothing fits')

      expect(fetch).not.toHaveBeenCalled()
      expect(notificationsSelfReportRepository.saveSelfReports).toHaveBeenCalledExactlyOnceWith([
        {
          date: NOTIFICATION_DATE,
          message: 'The notification was not sent: Nothing fits',
          level: 'ERROR',
          origin: 'notificationsTelegramService'
        }
      ])
    })

    it('Should throw when Telegram cannot be reached and it was created without a self-report repository', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network down'))

      await expect(
        createNotificationsTelegramService(telegramOptions).notify(() => 'Hello')
      ).rejects.toThrow('Network down')
    })
  })
})

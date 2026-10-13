import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createNotificationsTelegramService } from '../notificationsTelegram.service.js'

const notificationsService = createNotificationsTelegramService({
  telegramChatId: 'chat-123',
  telegramBotToken: 'bot-token',
  telegramBaseUrl: 'https://telegram.test',
  telegramMessageSizeLimit: 120
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createNotificationsTelegramService', () => {
  describe('getMessageSizeLimit', () => {
    it('Should give the size limit it was created with', () => {
      expect(notificationsService.getMessageSizeLimit()).toBe(120)
    })
  })

  describe('notify', () => {
    it('Should post the message to the chat it was created with', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response)

      await notificationsService.notify('Hello')

      expect(fetch).toHaveBeenCalledWith('https://telegram.test/botbot-token/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: 'chat-123', text: 'Hello' })
      })
    })

    it('Should throw when the Telegram API responds with a non-ok status', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response)

      await expect(notificationsService.notify('Hello')).rejects.toThrow('Telegram API error: 500')
    })
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockNotificationConfig } from '../../../test/mocks/configs.js'
import { createNotifierService } from '../notifier.service.js'

const notificationConfig = getMockNotificationConfig({
  telegramChatId: 'chat-123',
  telegramBotToken: 'bot-token',
  telegramBaseUrl: 'https://telegram.test',
  telegramMessageSizeLimit: 120
})
const notifierService = createNotifierService(notificationConfig)

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('NotifierService', () => {
  describe('getMessageSizeLimit', () => {
    it('should give the size limit of the config', () => {
      expect(notifierService.getMessageSizeLimit()).toBe(120)
    })
  })

  describe('notify', () => {
    it('should post the message to the configured chat', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response)

      await notifierService.notify('Hello')

      expect(fetch).toHaveBeenCalledWith('https://telegram.test/botbot-token/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: 'chat-123', text: 'Hello' })
      })
    })

    it('should throw when the Telegram API responds with a non-ok status', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response)

      await expect(notifierService.notify('Hello')).rejects.toThrow('Telegram API error: 500')
    })
  })
})

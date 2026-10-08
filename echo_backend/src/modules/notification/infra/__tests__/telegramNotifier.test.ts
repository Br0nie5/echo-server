import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockNotificationConfig } from '../../../../test/mocks/configs.js'
import { createTelegramNotifier } from '../telegramNotifier.js'

const telegramNotifierApi = { sendMessage: vi.fn() }
const notifier = createTelegramNotifier(
  telegramNotifierApi,
  getMockNotificationConfig({ telegramMessageSizeLimit: 120 })
)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('TelegramNotifier', () => {
  describe('getMessageSizeLimit', () => {
    it('should give the size limit of the config', () => {
      expect(notifier.getMessageSizeLimit()).toBe(120)
    })
  })

  describe('notify', () => {
    it('should send the message', async () => {
      await notifier.notify('Hello')

      expect(telegramNotifierApi.sendMessage).toHaveBeenCalledWith('Hello')
    })

    it('should throw when the message cannot be sent', async () => {
      telegramNotifierApi.sendMessage.mockRejectedValueOnce(new Error('Telegram API error: 500'))

      await expect(notifier.notify('Hello')).rejects.toThrow('Telegram API error: 500')
    })
  })
})

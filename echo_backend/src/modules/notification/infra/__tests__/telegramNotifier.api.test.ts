import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockNotificationConfig } from '../../../../test/mocks/configs.js'
import { createTelegramNotifierApi } from '../telegramNotifier.api.js'

const notificationConfig = getMockNotificationConfig()
const telegramNotifierApi = createTelegramNotifierApi(notificationConfig)

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('TelegramNotifierApi.sendMessage', () => {
  it('should post the message to the configured chat', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response)

    await telegramNotifierApi.sendMessage('Hello')

    expect(fetch).toHaveBeenCalledWith(`${notificationConfig.telegramBaseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: notificationConfig.telegramChatId, text: 'Hello' })
    })
  })

  it('should throw when the Telegram API responds with a non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response)

    await expect(telegramNotifierApi.sendMessage('Hello')).rejects.toThrow(
      'Telegram API error: 500'
    )
  })
})

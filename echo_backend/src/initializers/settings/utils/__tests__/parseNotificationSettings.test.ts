import { describe, it, expect } from 'vitest'

import { parseNotificationSettings } from '../parseNotificationSettings.js'

const NOTIFICATION_ENV: NodeJS.ProcessEnv = {
  TELEGRAM_CHAT_ID: '123456789',
  TELEGRAM_BOT_TOKEN: '123456:ABC-DEF'
}

const NOTIFICATION_CONSTANTS = {
  telegramBaseUrl: 'https://api.telegram.org',
  telegramMessageSizeLimit: 4096,
  telegramRequestTimeoutMilliseconds: 10000
}

describe('parseNotificationSettings', () => {
  it('Should define the notification settings if all the required variables are set', () => {
    expect(parseNotificationSettings(NOTIFICATION_ENV, NOTIFICATION_CONSTANTS)).toStrictEqual({
      telegramChatId: '123456789',
      telegramBotToken: '123456:ABC-DEF',
      telegramBaseUrl: 'https://api.telegram.org',
      telegramMessageSizeLimit: 4096,
      telegramRequestTimeoutMilliseconds: 10000
    })
  })

  it.each(['TELEGRAM_CHAT_ID', 'TELEGRAM_BOT_TOKEN'])(
    'Should not define the notification settings if %s is not set',
    (key) => {
      expect(
        parseNotificationSettings({ ...NOTIFICATION_ENV, [key]: undefined }, NOTIFICATION_CONSTANTS)
      ).toBeUndefined()
    }
  )
})

import { describe, it, expect } from 'vitest'

import { parseNotificationConfig } from '../parseNotificationConfig.js'

const NOTIFICATION_ENV: NodeJS.ProcessEnv = {
  TELEGRAM_CHAT_ID: '123456789',
  TELEGRAM_BASE_URL: 'https://api.telegram.org/bot123456789'
}

const NOTIFICATION_CONSTANTS = { telegramMessageSizeLimit: 4096 }

describe('parseNotificationConfig', () => {
  it('should define the notification config if all the required variables are set', () => {
    expect(parseNotificationConfig(NOTIFICATION_ENV, NOTIFICATION_CONSTANTS)).toStrictEqual({
      telegramChatId: '123456789',
      telegramBaseUrl: 'https://api.telegram.org/bot123456789',
      telegramMessageSizeLimit: 4096
    })
  })

  it.each(['TELEGRAM_CHAT_ID', 'TELEGRAM_BASE_URL'])(
    'should not define the notification config if %s is not set',
    (key) => {
      expect(
        parseNotificationConfig({ ...NOTIFICATION_ENV, [key]: undefined }, NOTIFICATION_CONSTANTS)
      ).toBeUndefined()
    }
  )
})

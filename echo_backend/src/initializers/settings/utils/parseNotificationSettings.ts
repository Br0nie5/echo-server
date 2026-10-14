import type { NotificationSettings } from '../settings.js'

/**
 * Parses the Telegram variables of `processEnv` into the settings of the notifications, completed
 * with the constants `telegramBaseUrl`, `telegramMessageSizeLimit` and
 * `telegramRequestTimeoutMilliseconds`.
 *
 * It is `undefined`, which leaves the backend with no channel to notify through, when neither
 * `TELEGRAM_CHAT_ID` nor `TELEGRAM_BOT_TOKEN` is set. Throws when only one of them is.
 */
export const parseNotificationSettings = (
  processEnv: NodeJS.ProcessEnv,
  constants: Pick<
    NotificationSettings,
    'telegramBaseUrl' | 'telegramMessageSizeLimit' | 'telegramRequestTimeoutMilliseconds'
  >
): NotificationSettings | undefined => {
  const telegramChatId = processEnv.TELEGRAM_CHAT_ID
  const telegramBotToken = processEnv.TELEGRAM_BOT_TOKEN

  if (!telegramChatId && !telegramBotToken) {
    return undefined
  }

  if (!telegramChatId || !telegramBotToken) {
    throw new Error('TELEGRAM_CHAT_ID and TELEGRAM_BOT_TOKEN must both be set to notify')
  }

  return { telegramChatId, telegramBotToken, ...constants }
}

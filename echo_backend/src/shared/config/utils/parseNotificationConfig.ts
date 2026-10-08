import type { NotificationConfig } from '../backConfig.js'

/**
 * Parses the Telegram variables of `processEnv` into the config of the notifications, completed
 * with `telegramMessageSizeLimit`.
 *
 * It is `undefined`, which leaves the backend with no channel to notify through, unless
 * `TELEGRAM_CHAT_ID` and `TELEGRAM_BASE_URL` are both set.
 */
export const parseNotificationConfig = (
  processEnv: NodeJS.ProcessEnv,
  { telegramMessageSizeLimit }: Pick<NotificationConfig, 'telegramMessageSizeLimit'>
): NotificationConfig | undefined => {
  const telegramChatId = processEnv.TELEGRAM_CHAT_ID
  const telegramBaseUrl = processEnv.TELEGRAM_BASE_URL

  if (!telegramChatId || !telegramBaseUrl) {
    return undefined
  }

  return { telegramChatId, telegramBaseUrl, telegramMessageSizeLimit }
}

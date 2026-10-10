import type { NotificationConfig } from '../backConfig.js'

/**
 * Parses the Telegram variables of `processEnv` into the config of the notifications, completed
 * with the constants `telegramBaseUrl` and `telegramMessageSizeLimit`.
 *
 * It is `undefined`, which leaves the backend with no channel to notify through, unless
 * `TELEGRAM_CHAT_ID` and `TELEGRAM_BOT_TOKEN` are both set.
 */
export const parseNotificationConfig = (
  processEnv: NodeJS.ProcessEnv,
  {
    telegramBaseUrl,
    telegramMessageSizeLimit
  }: Pick<NotificationConfig, 'telegramBaseUrl' | 'telegramMessageSizeLimit'>
): NotificationConfig | undefined => {
  const telegramChatId = processEnv.TELEGRAM_CHAT_ID
  const telegramBotToken = processEnv.TELEGRAM_BOT_TOKEN

  if (!telegramChatId || !telegramBotToken) {
    return undefined
  }

  return { telegramChatId, telegramBotToken, telegramBaseUrl, telegramMessageSizeLimit }
}

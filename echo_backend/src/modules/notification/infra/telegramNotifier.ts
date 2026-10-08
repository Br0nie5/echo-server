import type { NotificationConfig } from '../../../shared/config/backConfig.js'
import type { Notifier } from '../domain/notifier.js'

import type { TelegramNotifierApi } from './telegramNotifier.api.js'

/**
 * Builds the `Notifier` that sends its messages on Telegram, through `telegramNotifierApi`.
 *
 * Its size limit is the `telegramMessageSizeLimit` of the config.
 *
 * ```ts
 * const notifier = createTelegramNotifier(
 *   createTelegramNotifierApi(notificationConfig),
 *   notificationConfig
 * )
 * ```
 */
export const createTelegramNotifier = (
  telegramNotifierApi: TelegramNotifierApi,
  { telegramMessageSizeLimit }: NotificationConfig
): Notifier => ({
  getMessageSizeLimit: (): number => telegramMessageSizeLimit,

  notify: (message): Promise<void> => telegramNotifierApi.sendMessage(message)
})

import type { NotificationsService } from '../domain/notifications.service.js'

/** What {@link createNotificationsTelegramService} needs. */
export interface CreateNotificationsTelegramServiceOptions {
  /** Chat the messages are sent to. */
  telegramChatId: string
  /** Token of the bot the messages are sent by. A secret. */
  telegramBotToken: string
  /** Base URL of the Telegram bot API, without the token. */
  telegramBaseUrl: string
  /** Maximum length of a Telegram message. */
  telegramMessageSizeLimit: number
}

/**
 * Builds the `NotificationsService` sending its messages through Telegram: to the chat
 * `telegramChatId`, from the bot of `telegramBotToken`, through the Telegram bot API at
 * `telegramBaseUrl`, within the `telegramMessageSizeLimit`.
 *
 * Notifying throws when Telegram cannot be reached or answers with an error status.
 *
 * It is meant to be built once, when the notifications are set up, and handed to whatever
 * notifies:
 *
 * ```ts
 * const notificationsService = createNotificationsTelegramService({
 *   telegramChatId: '123456789',
 *   telegramBotToken: '123456:ABC-DEF',
 *   telegramBaseUrl: 'https://api.telegram.org',
 *   telegramMessageSizeLimit: 4096
 * })
 * await notificationsService.notify('3 problem logs since 08:00')
 * ```
 */
export const createNotificationsTelegramService = ({
  telegramChatId,
  telegramBotToken,
  telegramBaseUrl,
  telegramMessageSizeLimit
}: CreateNotificationsTelegramServiceOptions): NotificationsService => ({
  getMessageSizeLimit: (): number => telegramMessageSizeLimit,

  notify: async (message): Promise<void> => {
    const response = await fetch(`${telegramBaseUrl}/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: telegramChatId, text: message })
    })

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`)
    }
  }
})

import type { NotificationConfig } from '../config/backConfig.js'

/**
 * Service sending messages to the outside, through the channel of the config (Telegram).
 *
 * It knows nothing of what the messages say: whoever notifies writes the message, within the size
 * limit the service gives.
 *
 * ```ts
 * const message = buildMessageWithin(notifierService.getMessageSizeLimit())
 * await notifierService.notify(message)
 * ```
 */
export interface NotifierService {
  /** The maximum length of a message the channel takes. */
  getMessageSizeLimit: () => number
  /**
   * Sends `message`, which must not be longer than the size limit of the channel.
   *
   * Throws when the channel cannot be reached or answers with an error status.
   */
  notify: (message: string) => Promise<void>
}

/**
 * Builds the notifier service, sending its messages to the chat `telegramChatId` from the bot
 * behind `telegramBaseUrl`, within the `telegramMessageSizeLimit`.
 *
 * It is meant to be built once, when the notifications are configured, and handed to whatever
 * notifies:
 *
 * ```ts
 * const notifierService = createNotifierService(notificationConfig)
 * await notifierService.notify('3 problem logs since 08:00')
 * ```
 */
export const createNotifierService = ({
  telegramBaseUrl,
  telegramChatId,
  telegramMessageSizeLimit
}: NotificationConfig): NotifierService => ({
  getMessageSizeLimit: (): number => telegramMessageSizeLimit,

  notify: async (message): Promise<void> => {
    const response = await fetch(`${telegramBaseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: telegramChatId, text: message })
    })

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`)
    }
  }
})

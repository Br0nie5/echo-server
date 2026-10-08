import type { NotificationConfig } from '../../../shared/config/backConfig.js'

/** Access to the Telegram bot API, the channel the notifications are sent through. */
export interface TelegramNotifierApi {
  /**
   * Sends `message` to the configured chat, from the configured bot.
   *
   * Throws when the Telegram API cannot be reached or answers with an error status.
   */
  sendMessage: (message: string) => Promise<void>
}

/** Builds the access to the bot behind `telegramBaseUrl`, which writes to the chat `telegramChatId`. */
export const createTelegramNotifierApi = ({
  telegramBaseUrl,
  telegramChatId
}: NotificationConfig): TelegramNotifierApi => ({
  sendMessage: async (message): Promise<void> => {
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

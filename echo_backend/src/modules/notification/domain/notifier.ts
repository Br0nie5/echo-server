/**
 * A channel notifications are sent through (Telegram, e-mail, ...).
 *
 * The domain only states what it needs from the channel: the `infra` folder holds the
 * implementations.
 *
 * ```ts
 * const message = buildMessageWithin(notifier.getMessageSizeLimit())
 * await notifier.notify(message)
 * ```
 */
export interface Notifier {
  /** The maximum length of a message the channel takes. */
  getMessageSizeLimit: () => number
  /**
   * Sends `message`, which must not be longer than the size limit of the channel.
   *
   * Throws when the message could not be sent.
   */
  notify: (message: string) => Promise<void>
}

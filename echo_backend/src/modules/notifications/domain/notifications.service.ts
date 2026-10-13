/**
 * Service sending messages to the outside, through a channel only its implementation knows.
 *
 * It knows nothing of what the messages say: whoever notifies writes the message, within the size
 * limit the service gives.
 *
 * ```ts
 * const message = buildMessageWithin(notificationsService.getMessageSizeLimit())
 * await notificationsService.notify(message)
 * ```
 */
export interface NotificationsService {
  /** The maximum length of a message the channel takes. */
  getMessageSizeLimit: () => number
  /**
   * Sends `message`, which must not be longer than the size limit of the channel.
   *
   * Throws when the channel cannot be reached or refuses the message.
   */
  notify: (message: string) => Promise<void>
}

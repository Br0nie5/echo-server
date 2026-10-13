/**
 * Service sending messages to the outside, through a channel only its implementation knows.
 *
 * It knows nothing of what the messages say: whoever notifies gives the function writing the
 * message, which the service calls with the size limit of its channel.
 *
 * ```ts
 * await notificationsService.notify((messageSizeLimit) => buildMessageWithin(messageSizeLimit))
 * ```
 */
export interface NotificationsService {
  /**
   * Sends the message `buildMessage` returns.
   *
   * `buildMessage` is given the maximum length of a message the channel takes, and must return a
   * message that is not longer. It throws when no message fits.
   *
   * Throws when `buildMessage` does, with its error, and when the channel cannot be reached or
   * refuses the message. Nothing was sent then.
   */
  notify: (buildMessage: (messageSizeLimit: number) => string) => Promise<void>
}

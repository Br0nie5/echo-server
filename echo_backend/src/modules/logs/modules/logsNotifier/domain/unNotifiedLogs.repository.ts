import type { Log } from '@echo/utilities'

/**
 * The logs one read of the {@link UnNotifiedLogsRepository} gives, with the way to say they were
 * notified.
 */
export interface UnNotifiedLogs {
  /** The logs that were not notified yet, unordered. */
  logs: Log[]
  /**
   * Records that `logs` were notified, so no later read gives them again.
   *
   * It only covers the logs of its own read: a log stored after that read is given by the next
   * one, even when it is stored before this is called.
   */
  markAsNotified: () => Promise<void>
}

/**
 * Storage of the logs that were not notified yet.
 *
 * The domain only states what it needs from the storage: the `infra` folder holds the
 * implementations, which decide how they remember what was notified.
 *
 * ```ts
 * const { logs, markAsNotified } = await unNotifiedLogsRepository.getUnNotifiedLogs()
 *
 * await notificationsService.notify((messageSizeLimit) => buildMessage(logs, messageSizeLimit))
 * await markAsNotified()
 * ```
 */
export interface UnNotifiedLogsRepository {
  /**
   * Reads the logs that were not notified yet, whatever their level.
   *
   * While none was ever marked as notified, that is every log. Reading again without calling
   * `markAsNotified` gives the same logs again, along with the ones stored since.
   */
  getUnNotifiedLogs: () => Promise<UnNotifiedLogs>
}

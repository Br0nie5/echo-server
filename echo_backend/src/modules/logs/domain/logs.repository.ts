import type { Log } from '@echo/utilities'

/**
 * Storage of the logs.
 *
 * The domain only states what it needs from the storage: the `infra` folder holds the
 * implementations. Each log carries its `location`, which says where it is stored and means
 * something to the implementation only (the path of a file, the address of another server...).
 *
 * ```ts
 * const logs = await logsRepository.getAllLogs()
 * ```
 */
export interface LogsRepository {
  /**
   * Reads the log entries of every location the storage watches, unordered.
   *
   * A stored entry that holds no valid log is left out: reporting it is up to the storage.
   */
  getAllLogs: () => Promise<Log[]>
}

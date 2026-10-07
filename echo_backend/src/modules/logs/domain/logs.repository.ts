import type { Log } from '@echo/utilities'

/**
 * Storage of the logs.
 *
 * The domain only states what it needs from the storage: the `infra` folder holds the
 * implementations.
 */
export interface LogsRepository {
  /** Every stored log entry, unordered. */
  findAllLogs: () => Promise<Log[]>
}

import type { Log } from '@echo/utilities'

import type { SelfReport } from '../../selfReport/domain/selfReport.js'

/** What reading the storage of the logs gives. */
export interface FoundLogs {
  /** The stored log entries, unordered. */
  logs: Log[]
  /**
   * A diagnostic for each stored entry that holds no valid log, and is therefore left out of
   * `logs`.
   */
  selfReports: SelfReport[]
}

/**
 * Storage of the logs.
 *
 * The domain only states what it needs from the storage: the `infra` folder holds the
 * implementations. Each log carries its `location`, which says where it is stored and means
 * something to the implementation only (the path of a file, the address of another server...).
 *
 * ```ts
 * const { logs, selfReports } = await logsRepository.getAllLogs()
 * ```
 */
export interface LogsRepository {
  /**
   * Reads the log entries of every location the storage watches.
   *
   * It only reads: what to do with the `selfReports` it gives is up to the use case calling it.
   */
  getAllLogs: () => Promise<FoundLogs>
}

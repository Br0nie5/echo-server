import type { Log } from '@echo/utilities'

import type { SelfReport } from '../../selfReport/domain/selfReport.js'

/** What reading the storage of the logs gives. */
export interface FoundLogs {
  /** The stored log entries, unordered. */
  logs: Log[]
  /** A diagnostic for each stored entry that holds no valid log, and is therefore left out of `logs`. */
  selfReports: SelfReport[]
}

/**
 * Storage of the logs.
 *
 * The domain only states what it needs from the storage: the `infra` folder holds the
 * implementations. A `location` says where some logs are stored. It means something to the
 * implementation only (the path of a file, the address of another server...): whoever uses the
 * repository is given its locations, and hands them over as they are.
 *
 * ```ts
 * const { logs } = await logsRepository.getLogs(location)
 * await logsRepository.saveLogs([...logs, newLog])
 * ```
 */
export interface LogsRepository {
  /**
   * Reads the log entries of every location the storage watches.
   *
   * It only reads: what to do with the `selfReports` it gives is up to the use case calling it.
   */
  getAllLogs: () => Promise<FoundLogs>
  /**
   * Reads the log entries stored at `location`, in the order they are stored.
   *
   * A location nothing was stored at yet has none. Throws when the location cannot be read.
   */
  getLogs: (location: string) => Promise<FoundLogs>
  /**
   * Stores each of `logs` at its own `location`.
   *
   * At every location one of them has, they become everything that is stored there, replacing
   * what was there, in the order the storage keeps its logs in: a location none of them has is left untouched, so
   * emptying one is what `deleteLogs` is for. A location changes in one step: whoever reads it
   * meanwhile gets either its previous logs or the new ones. Throws when a location cannot be
   * written.
   */
  saveLogs: (logs: Log[]) => Promise<void>
  /**
   * Leaves nothing stored at `location`, which stays one logs can be stored at.
   *
   * Throws when the location cannot be written.
   */
  deleteLogs: (location: string) => Promise<void>
}

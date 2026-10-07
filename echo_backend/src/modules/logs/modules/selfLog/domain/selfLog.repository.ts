import type { SelfLog } from './selfLog.js'

/**
 * Storage of the self logs of one part of the backend.
 *
 * The domain only states what it needs from the storage: the `infra` folder holds the
 * implementations. Each part of the backend that reports diagnostics is given its own repository,
 * so where its self logs go is decided when the repository is created, not at each call.
 *
 * ```ts
 * await selfLogRepository.saveSelfLogs([
 *   { category: LogCategory.WARNING, message: 'not a log', callFile: 'backup', callLine: 3 }
 * ])
 * ```
 */
export interface SelfLogRepository {
  /**
   * Stores `selfLogs`, each dated from now.
   *
   * A self log replaces the one already stored with the same `callFile`, `callLine` and `message`:
   * reporting a problem again does not store it twice, it brings its date up to now. A problem that
   * is still there therefore stays recent, and one that is no longer reported keeps the date it
   * was last seen at. Never throws: a diagnostic that cannot be stored must not break what was
   * being diagnosed.
   */
  saveSelfLogs: (selfLogs: SelfLog[]) => Promise<void>
}

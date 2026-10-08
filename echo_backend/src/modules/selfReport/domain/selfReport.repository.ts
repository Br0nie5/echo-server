import type { SelfReport } from './selfReport.js'

/**
 * Storage of the self reports of one part of the backend.
 *
 * The domain only states what it needs from the storage: the `infra` folder holds the
 * implementations. Each part of the backend that reports diagnostics is given its own repository,
 * so where its self reports go is decided when the repository is created, not at each call.
 *
 * ```ts
 * await selfReportRepository.saveSelfReports([
 *   {
 *     date: new Date(),
 *     message: 'not a log',
 *     level: 'warning',
 *     reportedFile: 'backup',
 *     reportedLine: 3
 *   }
 * ])
 * ```
 */
export interface SelfReportRepository {
  /**
   * Stores `selfReports`.
   *
   * A self report replaces the one already stored with the same `reportedFile`, `reportedLine` and
   * `message`: reporting a problem again does not store it twice, it brings its date up to the one
   * of the new report. A problem that is still there therefore stays recent, and one that is no
   * longer reported keeps the date it was last seen at. Never throws: a diagnostic that cannot be
   * stored must not break what was being diagnosed.
   */
  saveSelfReports: (selfReports: SelfReport[]) => Promise<void>
}

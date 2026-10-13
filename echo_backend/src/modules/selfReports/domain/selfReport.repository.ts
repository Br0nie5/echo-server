import type { SelfReport, SelfReportsSession } from './selfReport.js'

/**
 * Storage of the self reports of one part of the backend.
 *
 * The domain only states what it needs from the storage: the `infra` folder holds the
 * implementations. Each part of the backend that reports diagnostics is given its own repository,
 * so where its self reports go, and the session they are reported during, are decided when the
 * repository is created, not at each call. A part given none does not report: the self reports are
 * disabled.
 *
 * ```ts
 * await selfReportRepository.saveSelfReports([
 *   {
 *     date: new Date('2026-09-19T14:41:09.669Z'),
 *     message: 'not a log',
 *     level: 'WARNING',
 *     origin: '/watched_logs/export_orders.jsonl:3'
 *   }
 * ])
 *
 * const selfReports = await selfReportRepository.getAllSelfReports()
 * const { sessionId, locationName } = selfReports[0]
 * ```
 */
export interface SelfReportRepository {
  /**
   * Stores `selfReports`, after the ones already stored, as reported during the session of the
   * repository.
   *
   * A self report with the `level`, the `message` and the `origin` of one already stored, or of one
   * before it in `selfReports`, is left out: a problem is stored once, as it was first reported.
   * Never throws: a diagnostic that cannot be stored must not break what was being diagnosed.
   */
  saveSelfReports: (selfReports: SelfReport[]) => Promise<void>
  /**
   * Reads the self reports of the whole storage, those the other parts of the backend stored and
   * those of the sessions before included, unordered, each with the session it was reported during
   * and where it is stored.
   *
   * Never throws: it gives none when the storage cannot be read.
   */
  getAllSelfReports: () => Promise<Array<SelfReport & SelfReportsSession>>
}

import type { SelfReportRepository } from '../domain/selfReport.repository.js'

/**
 * Builds a `SelfReportRepository` that stores nothing.
 *
 * It is what the backend reports through when the self reports are disabled, or when their storage
 * could not be prepared, so nobody has to check whether self reports are on before reporting.
 */
export const createNoopSelfReportRepository = (): SelfReportRepository => ({
  saveSelfReports: async (): Promise<void> => {}
})

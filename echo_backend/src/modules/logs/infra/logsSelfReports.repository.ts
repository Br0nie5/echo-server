import { createLogId, type Log } from '@echo/utilities'

import type { SelfReportRepository } from '../../selfReport/domain/selfReport.repository.js'
import type { LogsRepository } from '../domain/logs.repository.js'

/**
 * Builds the `LogsRepository` whose logs are the self reports of `selfReportRepository`, every one
 * it holds, each as a log of its own.
 *
 * Such a log keeps the `date`, the `message`, the `level`, the `origin`, the `location`, the
 * `locationName` and the `groupName` of its self report, a self report having two of the levels of
 * a log. Its job is the session the self report was reported during, and its `id` the one
 * `createLogId` gives it, with its position among the self reports that are read.
 *
 * ```ts
 * const logsRepository = createLogsSelfReportsRepository(parseLogsSelfReportRepository)
 * const selfReportsLogs = await logsRepository.getAllLogs()
 * ```
 */
export const createLogsSelfReportsRepository = (
  selfReportRepository: SelfReportRepository
): LogsRepository => ({
  getAllLogs: async (): Promise<Log[]> => {
    const selfReports = await selfReportRepository.getAllSelfReports()

    return selfReports.map(({ date, sessionId: jobId, ...selfReport }, index) => {
      const noIdLog: Omit<Log, 'id'> = { ...selfReport, date: date.toISOString(), jobId }

      return { ...noIdLog, id: createLogId(noIdLog, index) }
    })
  }
})

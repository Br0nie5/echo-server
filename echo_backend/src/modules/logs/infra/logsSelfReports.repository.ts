import { createLogId, type Log } from '@echo/utilities'

import type { SelfReportRepository } from '../../selfReports/domain/selfReport.repository.js'
import type { LogsRepository } from '../domain/logs.repository.js'

/**
 * Builds the `LogsRepository` whose logs are the self reports of `selfReportRepositories`, every
 * one each of them holds, each as a log of its own.
 *
 * Such a log keeps the `date`, the `message`, the `level`, the `origin`, the `location`, the
 * `locationName` and the `groupName` of its self report, a self report having two of the levels of
 * a log. Its job is the session the self report was reported during, and its `id` the one
 * `createLogId` gives it, with its position among the self reports of its own repository: a self
 * report stored in one repository changes the id of no log of another.
 *
 * ```ts
 * const logsRepository = createLogsSelfReportsRepository([
 *   logFilesSelfReportRepository,
 *   notificationsSelfReportRepository
 * ])
 * const selfReportsLogs = await logsRepository.getAllLogs()
 * ```
 */
export const createLogsSelfReportsRepository = (
  selfReportRepositories: SelfReportRepository[]
): LogsRepository => {
  const getLogsOfRepository = async (
    selfReportRepository: SelfReportRepository
  ): Promise<Log[]> => {
    const selfReports = await selfReportRepository.getSelfReports()

    return selfReports.map(({ date, sessionId: jobId, ...selfReport }, index) => {
      const noIdLog: Omit<Log, 'id'> = { ...selfReport, date: date.toISOString(), jobId }

      return { ...noIdLog, id: createLogId(noIdLog, index) }
    })
  }

  return {
    getAllLogs: async (): Promise<Log[]> =>
      (await Promise.all(selfReportRepositories.map(getLogsOfRepository))).flat()
  }
}

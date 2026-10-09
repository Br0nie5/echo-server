import type { LogsFilesApi } from '../../modules/logs/infra/logsFiles.api.js'
import type { SelfReportRepository } from '../../modules/selfReport/domain/selfReport.repository.js'
import { createFileSessionJobIdApi } from '../../modules/selfReport/infra/fileSessionJobId.api.js'
import { createNoopSelfReportRepository } from '../../modules/selfReport/infra/noopSelfReport.repository.js'
import { createSelfFileReportRepository } from '../../modules/selfReport/infra/selfFileReport.repository.js'
import type { SelfReportsConfig } from '../../shared/config/backConfig.js'
import type { EchoServer } from '../types/echoServer.js'

/**
 * Gives the repository a part of the backend stores its self reports in.
 *
 * It stores them through `logsFilesApi`, in the file of `selfReportsConfig` that
 * `getSelfReportFileName` picks. Without a `selfReportsConfig`, the self reports are disabled, and
 * it stores nothing:
 *
 * ```ts
 * const selfReportRepository = await getSelfReportRepository(
 *   server,
 *   logsFilesApi,
 *   config.selfReports,
 *   ({ parseLogFileSelfReportFileName }) => parseLogFileSelfReportFileName
 * )
 * ```
 */
export const getSelfReportRepository = (
  server: EchoServer,
  logsFilesApi: LogsFilesApi,
  selfReportsConfig: SelfReportsConfig | undefined,
  getSelfReportFileName: (selfReportsConfig: SelfReportsConfig) => string
): Promise<SelfReportRepository> | SelfReportRepository =>
  selfReportsConfig !== undefined
    ? createSelfFileReportRepository({
        logsFilesApi,
        sessionJobIdApi: createFileSessionJobIdApi(selfReportsConfig),
        selfReportsConfig,
        selfReportFileName: getSelfReportFileName(selfReportsConfig),
        logger: server.log
      })
    : createNoopSelfReportRepository()

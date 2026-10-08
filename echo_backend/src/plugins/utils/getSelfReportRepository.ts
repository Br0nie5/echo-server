import type { LogsFilesApi } from '../../modules/logs/infra/logsFiles.api.js'
import type { SelfReportRepository } from '../../modules/selfReport/domain/selfReport.repository.js'
import { createFileSessionJobIdApi } from '../../modules/selfReport/infra/fileSessionJobId.api.js'
import { createNoopSelfReportRepository } from '../../modules/selfReport/infra/noopSelfReport.repository.js'
import { createSelfFileReportRepository } from '../../modules/selfReport/infra/selfFileReport.repository.js'
import type { SelfReportsConfig } from '../../shared/config/backConfig.js'
import type { EchoServer } from '../types/echoServer.js'

/** The repository storing its self reports in the file named `selfReportFileName`, through `logsFilesApi`, or storing nothing when the self reports are disabled. */
export const getSelfReportRepository = (
  server: EchoServer,
  logsFilesApi: LogsFilesApi,
  selfReportsConfig: SelfReportsConfig,
  selfReportFileName: string
): Promise<SelfReportRepository> | SelfReportRepository =>
  selfReportsConfig.isEnabled
    ? createSelfFileReportRepository({
        logsFilesApi,
        sessionJobIdApi: createFileSessionJobIdApi(selfReportsConfig),
        selfReportsConfig,
        selfReportFileName,
        logger: server.log
      })
    : createNoopSelfReportRepository()

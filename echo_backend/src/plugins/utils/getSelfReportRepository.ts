import path from 'path'

import type { LogsRepository } from '../../modules/logs/domain/logs.repository.js'
import type { SelfReportRepository } from '../../modules/selfReport/domain/selfReport.repository.js'
import { createFileSessionJobIdApi } from '../../modules/selfReport/infra/fileSessionJobId.api.js'
import { createNoopSelfReportRepository } from '../../modules/selfReport/infra/noopSelfReport.repository.js'
import { createSelfLogReportRepository } from '../../modules/selfReport/infra/selfLogReport.repository.js'
import type { SelfReportsConfig } from '../../shared/config/backConfig.js'
import type { FilesService } from '../../shared/services/files.service.js'
import type { EchoServer } from '../types/echoServer.js'

/**
 * Gives the repository a part of the backend stores its self reports in.
 *
 * It stores them as logs of `logsRepository`, at the location made of the self-reports directory
 * of `selfReportsConfig` and of the file name `getSelfReportFileName` picks in it, named after that
 * file without its extension, and remembers its session in the session file, through
 * `filesService`. Without a `selfReportsConfig`, the self reports are disabled, and it stores
 * nothing:
 *
 * ```ts
 * const selfReportRepository = await getSelfReportRepository(
 *   server,
 *   logsRepository,
 *   filesService,
 *   config.selfReports,
 *   ({ parseLogFileSelfReportFileName }) => parseLogFileSelfReportFileName
 * )
 * ```
 */
export const getSelfReportRepository = (
  server: EchoServer,
  logsRepository: LogsRepository,
  filesService: FilesService,
  selfReportsConfig: SelfReportsConfig | undefined,
  getSelfReportFileName: (selfReportsConfig: SelfReportsConfig) => string
): Promise<SelfReportRepository> | SelfReportRepository => {
  if (selfReportsConfig === undefined) {
    return createNoopSelfReportRepository()
  }

  const selfReportFileName = getSelfReportFileName(selfReportsConfig)

  return createSelfLogReportRepository({
    logsRepository,
    sessionJobIdApi: createFileSessionJobIdApi(selfReportsConfig, filesService),
    selfReportsConfig,
    selfReportsLocation: path.join(selfReportsConfig.selfReportsDirPath, selfReportFileName),
    selfReportsLocationName: path.parse(selfReportFileName).name,
    logger: server.log
  })
}

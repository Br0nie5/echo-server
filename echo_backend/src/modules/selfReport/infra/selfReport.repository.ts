import path from 'path'

import type { SelfReportsConfig } from '../../../shared/config/backConfig.js'
import type { FilesService } from '../../../shared/services/files.service.js'
import type { Logger } from '../../../shared/types/logger.js'
import type { LogsRepository } from '../../logs/domain/logs.repository.js'
import type { SelfReportRepository } from '../domain/selfReport.repository.js'

import { createFileSessionJobIdApi } from './fileSessionJobId.api.js'
import { createNoopSelfReportRepository } from './noopSelfReport.repository.js'
import { createSelfLogReportRepository } from './selfLogReport.repository.js'

/** What {@link createSelfReportRepository} needs. */
export interface CreateSelfReportRepositoryOptions {
  /** The storage the self reports are stored in, as logs. */
  logsRepository: LogsRepository
  /** What the session file is read and written with. */
  filesService: FilesService
  /** Missing when the self reports are disabled. */
  selfReportsConfig: SelfReportsConfig | undefined
  /** Picks, in `selfReportsConfig`, the name of the file the self reports are stored in. */
  getSelfReportFileName: (selfReportsConfig: SelfReportsConfig) => string
  /** Where what cannot be stored is written. */
  logger: Logger
}

/**
 * Creates the repository a part of the backend stores its self reports in.
 *
 * It stores them as logs of `logsRepository`, at the location made of the self-reports directory
 * of `selfReportsConfig` and of the file name `getSelfReportFileName` picks in it, named after that
 * file without its extension, and remembers its session in the session file, through
 * `filesService` (see `createSelfLogReportRepository`). Without a `selfReportsConfig`, the self
 * reports are disabled, and it stores nothing. Each part of the backend that reports is given its
 * own repository, so none of them names a file:
 *
 * ```ts
 * const selfReportRepository = await createSelfReportRepository({
 *   logsRepository,
 *   filesService,
 *   selfReportsConfig: config.selfReports,
 *   getSelfReportFileName: ({ parseLogFileSelfReportFileName }) => parseLogFileSelfReportFileName,
 *   logger: server.log
 * })
 * ```
 */
export const createSelfReportRepository = async ({
  logsRepository,
  filesService,
  selfReportsConfig,
  getSelfReportFileName,
  logger
}: CreateSelfReportRepositoryOptions): Promise<SelfReportRepository> => {
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
    logger
  })
}

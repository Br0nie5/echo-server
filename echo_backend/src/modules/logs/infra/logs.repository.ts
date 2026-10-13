import type { Log } from '@echo/utilities'

import type { LogsConfig } from '../../../shared/config/backConfig.js'
import type { FilesService } from '../../../shared/services/files.service.js'
import type { SelfReportRepository } from '../../selfReport/domain/selfReport.repository.js'
import type { LogsRepository } from '../domain/logs.repository.js'

import { createLogsFilesApi } from './logsFiles.api.js'
import { createLogsFilesRepository } from './logsFiles.repository.js'
import { createLogsSelfReportsRepository } from './logsSelfReports.repository.js'

/** What {@link createLogsRepository} needs. */
export interface CreateLogsRepositoryOptions {
  logsConfig: LogsConfig
  /** What the log files are read with. */
  filesService: FilesService
  /**
   * Where the lines of the log files that hold no log are reported, and where the self reports
   * given among the logs are read from. Missing when the self reports are disabled.
   */
  parseLogsSelfReportRepository: SelfReportRepository | undefined
}

/**
 * Creates the `LogsRepository` of the backend, from the storages it is given.
 *
 * Its logs are always those of the log files of `logsConfig`, read through `filesService` (see
 * `createLogsFilesRepository`). With a `parseLogsSelfReportRepository`, that is when the self
 * reports are enabled, they are also its self reports, each as a log (see
 * `createLogsSelfReportsRepository`): the log files are read first, so the self reports saved
 * while reading them are among the logs.
 *
 * ```ts
 * const logsRepository = createLogsRepository({
 *   logsConfig: config.logs,
 *   filesService,
 *   parseLogsSelfReportRepository
 * })
 * ```
 */
export const createLogsRepository = ({
  logsConfig,
  filesService,
  parseLogsSelfReportRepository
}: CreateLogsRepositoryOptions): LogsRepository => {
  const logsFilesRepository = createLogsFilesRepository(
    createLogsFilesApi(logsConfig, filesService),
    parseLogsSelfReportRepository
  )

  if (parseLogsSelfReportRepository === undefined) {
    return logsFilesRepository
  }

  const logsSelfReportsRepository = createLogsSelfReportsRepository(parseLogsSelfReportRepository)

  return {
    getAllLogs: async (): Promise<Log[]> => {
      const filesLogs = await logsFilesRepository.getAllLogs()
      const selfReportsLogs = await logsSelfReportsRepository.getAllLogs()

      return [...filesLogs, ...selfReportsLogs]
    }
  }
}

import type { Log } from '@echo/utilities'

import type { FilesService } from '../../../shared/services/files.service.js'
import type { SelfReportRepository } from '../../selfReports/domain/selfReport.repository.js'
import type { LogsRepository } from '../domain/logs.repository.js'

import { createLogsFilesApi, type LogsFilesLocation } from './logsFiles.api.js'
import { createLogsFilesRepository } from './logsFiles.repository.js'
import { createLogsSelfReportsRepository } from './logsSelfReports.repository.js'

/** What {@link createLogsRepository} needs. */
export interface CreateLogsRepositoryOptions extends LogsFilesLocation {
  /** What the log files are read with. */
  filesService: FilesService
  /**
   * Where the lines of the log files that hold no log are reported. Missing when the self reports
   * are disabled.
   */
  logFilesSelfReportRepository: SelfReportRepository | undefined
  /** The repositories whose self reports are given among the logs, each as a log. */
  selfReportRepositoriesToShow: SelfReportRepository[]
}

/**
 * Creates the `LogsRepository` of the backend, from the storages it is given.
 *
 * Its logs are always those of the log files, the files of `logsDirPath` whose name ends with
 * `logFileExtension`, read through `filesService` (see `createLogsFilesRepository`), which reports
 * the lines that hold no log to `logFilesSelfReportRepository`. With no repository in
 * `selfReportRepositoriesToShow`, that is when the self reports are disabled, these are its only
 * logs. Otherwise they are also the self reports of every one of them, each as a log (see
 * `createLogsSelfReportsRepository`): the log files are read first, so the self reports saved
 * while reading them are among the logs.
 *
 * ```ts
 * const logsRepository = createLogsRepository({
 *   logsDirPath: '/watched_logs',
 *   logFileExtension: '.jsonl',
 *   logFilesDirName: 'logs',
 *   filesService,
 *   logFilesSelfReportRepository,
 *   selfReportRepositoriesToShow: [logFilesSelfReportRepository, notificationsSelfReportRepository]
 * })
 * ```
 */
export const createLogsRepository = ({
  logsDirPath,
  logFileExtension,
  logFilesDirName,
  filesService,
  logFilesSelfReportRepository,
  selfReportRepositoriesToShow
}: CreateLogsRepositoryOptions): LogsRepository => {
  const logsFilesRepository = createLogsFilesRepository(
    createLogsFilesApi({ logsDirPath, logFileExtension, logFilesDirName }, filesService),
    logFilesSelfReportRepository
  )

  if (selfReportRepositoriesToShow.length === 0) {
    return logsFilesRepository
  }

  const logsSelfReportsRepository = createLogsSelfReportsRepository(selfReportRepositoriesToShow)

  return {
    getAllLogs: async (): Promise<Log[]> => {
      const filesLogs = await logsFilesRepository.getAllLogs()
      const selfReportsLogs = await logsSelfReportsRepository.getAllLogs()

      return [...filesLogs, ...selfReportsLogs]
    }
  }
}

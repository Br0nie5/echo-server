import type { LogsRepository } from '../modules/logs/domain/logs.repository.js'
import { createCheckDateFileApi } from '../modules/logs/modules/logsNotifier/infra/checkDateFile.api.js'
import { createCheckDateFileRepository } from '../modules/logs/modules/logsNotifier/infra/checkDateFile.repository.js'
import { logsNotifier } from '../modules/logs/modules/logsNotifier/presentation/logs.notifier.js'
import type { SelfReportRepository } from '../modules/selfReport/domain/selfReport.repository.js'
import { createSelfReportFilesRepository } from '../modules/selfReport/infra/selfReportFiles.repository.js'
import type { BackConfig } from '../shared/config/backConfig.js'
import type { FilesService } from '../shared/services/files.service.js'
import { createNotifierService } from '../shared/services/notifier.service.js'

import type { EchoServer } from './types/echoServer.js'

/** What `buildServer` already built that the cron notifying the problem logs is built with. */
export interface LogsNotifierDependencies {
  logsRepository: LogsRepository
  /**
   * Where the stored entries that hold no valid log are reported. Missing when the self reports
   * are disabled.
   */
  logsSelfReportRepository: SelfReportRepository | undefined
  /** What the last-check file and the files of its self reports are read and written with. */
  filesService: FilesService
}

/**
 * Registers the cron notifying the problem logs, only when it is configured along with the
 * notifications.
 *
 * The cron reads the logs like the routes do, from `logsRepository` and, when there is one,
 * reporting to `logsSelfReportRepository`, whose self reports are then among them. When the self
 * reports are enabled, it is given a self-report repository of its own for the problem logs it
 * could not notify. It notifies through a `NotifierService` built from the `notification` config.
 */
export const registerLogsNotifier = async (
  server: EchoServer,
  {
    logs: { logsNotifier: logsNotifierConfig },
    selfReports: selfReportsConfig,
    notification: notificationConfig
  }: BackConfig,
  { logsRepository, logsSelfReportRepository, filesService }: LogsNotifierDependencies
): Promise<void> => {
  if (logsNotifierConfig === undefined || notificationConfig === undefined) {
    server.log.info('The logs notifier is not configured, skipping its registration')
    return
  }

  await server.register(logsNotifier, {
    logsNotifierConfig,
    logsRepository,
    logsSelfReportRepository,
    notifierService: createNotifierService(notificationConfig),
    checkDateRepository: createCheckDateFileRepository(
      createCheckDateFileApi(logsNotifierConfig, filesService)
    ),
    logsNotifierSelfReportRepository: await createSelfReportFilesRepository({
      filesService,
      selfReportsConfig,
      getSelfReportFileName: ({ logsNotifierSelfReportFileName }) => logsNotifierSelfReportFileName,
      logger: server.log
    })
  })
}

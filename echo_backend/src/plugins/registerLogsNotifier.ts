import type { LogsRepository } from '../modules/logs/domain/logs.repository.js'
import { createFileCheckDateApi } from '../modules/logs/modules/logsNotifier/infra/fileCheckDate.api.js'
import { createFileCheckDateRepository } from '../modules/logs/modules/logsNotifier/infra/fileCheckDate.repository.js'
import logsNotifier from '../modules/logs/modules/logsNotifier/presentation/logs.notifier.js'
import { createTelegramNotifierApi } from '../modules/notification/infra/telegramNotifier.api.js'
import { createTelegramNotifier } from '../modules/notification/infra/telegramNotifier.js'
import type { SelfReportRepository } from '../modules/selfReport/domain/selfReport.repository.js'
import type { BackConfig } from '../shared/config/backConfig.js'
import type { FilesService } from '../shared/services/files.service.js'

import type { EchoServer } from './types/echoServer.js'
import { getSelfReportRepository } from './utils/getSelfReportRepository.js'

/** What `buildServer` already built that the cron notifying the problem logs is built with. */
export interface LogsNotifierDependencies {
  logsRepository: LogsRepository
  /** Where the stored entries that hold no valid log are reported. */
  selfReportRepository: SelfReportRepository
  /** What the last-check file and the session file of its self reports are read and written with. */
  filesService: FilesService
}

/**
 * Registers the cron notifying the problem logs, only when it is configured along with the
 * notifications.
 *
 * The cron reads the logs like the routes do, from `logsRepository` and reporting to
 * `selfReportRepository`, and is given a self-report repository of its own, storing as logs of
 * `logsRepository` too, for the problem logs it could not notify.
 */
export const registerLogsNotifier = async (
  server: EchoServer,
  {
    logs: { logsNotifier: logsNotifierConfig },
    selfReports: selfReportsConfig,
    notification: notificationConfig
  }: BackConfig,
  { logsRepository, selfReportRepository, filesService }: LogsNotifierDependencies
): Promise<void> => {
  if (logsNotifierConfig === undefined || notificationConfig === undefined) {
    server.log.info('The logs notifier is not configured, skipping its registration')
    return
  }

  await server.register(logsNotifier, {
    logsNotifierConfig,
    logsRepository,
    logsSelfReportRepository: selfReportRepository,
    notifier: createTelegramNotifier(
      createTelegramNotifierApi(notificationConfig),
      notificationConfig
    ),
    checkDateRepository: createFileCheckDateRepository(
      createFileCheckDateApi(logsNotifierConfig, filesService)
    ),
    selfReportRepository: await getSelfReportRepository(
      server,
      logsRepository,
      filesService,
      selfReportsConfig,
      ({ logsNotifierSelfReportFileName }) => logsNotifierSelfReportFileName
    )
  })
}

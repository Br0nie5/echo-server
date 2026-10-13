import type { LogsRepository } from '../modules/logs/domain/logs.repository.js'
import { createCheckDateFileApi } from '../modules/logs/modules/logsNotifier/infra/checkDateFile.api.js'
import { createCheckDateFileRepository } from '../modules/logs/modules/logsNotifier/infra/checkDateFile.repository.js'
import { logsNotifier } from '../modules/logs/modules/logsNotifier/presentation/logs.notifier.js'
import { createNotificationsTelegramService } from '../modules/notifications/infra/notificationsTelegram.service.js'
import { createSelfReportFilesRepository } from '../modules/selfReport/infra/selfReportFiles.repository.js'
import type { FilesService } from '../shared/services/files.service.js'

import type { Settings } from './settings/settings.js'
import type { EchoServer } from './types/echoServer.js'

/** What `buildServer` already built that the cron notifying the problem logs is built with. */
export interface LogsNotifierDependencies {
  logsRepository: LogsRepository
  /** What the last-check file and the files of its self reports are read and written with. */
  filesService: FilesService
}

/**
 * Registers the cron notifying the problem logs, only when it is set up along with the
 * notifications.
 *
 * The cron is given its config, and reads the logs like the routes do, from `logsRepository`. It
 * remembers its last check in the `lastLogsCheckFilePath` of its settings. When the self reports
 * are enabled, it is given a self-report repository of its own for the problem logs it could not
 * notify. It notifies through Telegram, with the `notification` settings.
 */
export const registerLogsNotifier = async (
  server: EchoServer,
  {
    logs: { logsNotifier: logsNotifierSettings },
    logsNotifierSelfReports: logsNotifierSelfReports,
    notification: notificationSettings
  }: Settings,
  { logsRepository, filesService }: LogsNotifierDependencies
): Promise<void> => {
  if (logsNotifierSettings === undefined || notificationSettings === undefined) {
    server.log.info('The logs notifier is not configured, skipping its registration')
    return
  }

  const { config: logsNotifierConfig, lastLogsCheckFilePath } = logsNotifierSettings

  await server.register(logsNotifier, {
    logsNotifierConfig,
    logsRepository,
    notificationsService: createNotificationsTelegramService(notificationSettings),
    checkDateRepository: createCheckDateFileRepository(
      createCheckDateFileApi({ lastLogsCheckFilePath }, filesService)
    ),
    logsNotifierSelfReportRepository:
      logsNotifierSelfReports &&
      (await createSelfReportFilesRepository({
        filesService,
        selfReportsDirPath: logsNotifierSelfReports.dirPath,
        selfReportFileExtension: logsNotifierSelfReports.fileExtension,
        selfReportFileName: logsNotifierSelfReports.fileName,
        sessionFilePath: logsNotifierSelfReports.sessionFilePath,
        retentionDays: logsNotifierSelfReports.retentionDays,
        logger: server.log
      }))
  })
}

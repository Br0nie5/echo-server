import type { LogsRepository } from '../modules/logs/domain/logs.repository.js'
import { createCheckDateFileApi } from '../modules/logs/modules/logsNotifier/infra/checkDateFile.api.js'
import { createUnNotifiedLogsCheckDateRepository } from '../modules/logs/modules/logsNotifier/infra/unNotifiedLogsCheckDate.repository.js'
import { logsNotifier } from '../modules/logs/modules/logsNotifier/presentation/logs.notifier.js'
import { createNotificationsTelegramService } from '../modules/notifications/infra/notificationsTelegram.service.js'
import type { SelfReportRepository } from '../modules/selfReports/domain/selfReport.repository.js'
import type { FilesService } from '../shared/services/files.service.js'

import type { Settings } from './settings/settings.js'
import type { EchoServer } from './types/echoServer.js'

/** What `buildServer` already built that the cron notifying the watched logs is built with. */
export interface LogsNotifierDependencies {
  logsRepository: LogsRepository
  /** Where the notifications that could not be sent are reported. Missing when the self reports are disabled. */
  notificationsSelfReportRepository: SelfReportRepository | undefined
  /** What the last-check file is read and written with. */
  filesService: FilesService
}

/**
 * Registers the cron notifying the watched logs, only when it is set up along with the
 * notifications.
 *
 * The cron is given its config, and the logs it has not notified yet: those of `logsRepository`,
 * which the routes read too, logged since its last check, whose date it remembers in the
 * `lastLogsCheckFilePath` of its settings. It notifies through Telegram, with the `notification`
 * settings, the notifications that could not be sent being reported to
 * `notificationsSelfReportRepository`.
 */
export const registerLogsNotifier = async (
  server: EchoServer,
  { logs: { logsNotifier: logsNotifierSettings }, notification: notificationSettings }: Settings,
  { logsRepository, notificationsSelfReportRepository, filesService }: LogsNotifierDependencies
): Promise<void> => {
  if (logsNotifierSettings === undefined || notificationSettings === undefined) {
    server.log.info('The logs notifier is not configured, skipping its registration')
    return
  }

  const { config: logsNotifierConfig, lastLogsCheckFilePath } = logsNotifierSettings

  await server.register(logsNotifier, {
    logsNotifierConfig,
    unNotifiedLogsRepository: createUnNotifiedLogsCheckDateRepository(
      logsRepository,
      createCheckDateFileApi({ lastLogsCheckFilePath }, filesService)
    ),
    notificationsService: createNotificationsTelegramService(
      notificationSettings,
      notificationsSelfReportRepository
    )
  })
}

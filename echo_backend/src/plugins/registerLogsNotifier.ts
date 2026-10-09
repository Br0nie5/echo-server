import type { LogsRepository } from '../modules/logs/domain/logs.repository.js'
import type { LogsFilesApi } from '../modules/logs/infra/logsFiles.api.js'
import { createFileCheckDateApi } from '../modules/logs/modules/logsNotifier/infra/fileCheckDate.api.js'
import { createFileCheckDateRepository } from '../modules/logs/modules/logsNotifier/infra/fileCheckDate.repository.js'
import logsNotifier from '../modules/logs/modules/logsNotifier/presentation/logs.notifier.js'
import { createTelegramNotifierApi } from '../modules/notification/infra/telegramNotifier.api.js'
import { createTelegramNotifier } from '../modules/notification/infra/telegramNotifier.js'
import type { BackConfig } from '../shared/config/backConfig.js'

import type { EchoServer } from './types/echoServer.js'
import { getSelfReportRepository } from './utils/getSelfReportRepository.js'

/** Registers the cron notifying the problem logs, only when it is configured along with the notifications. */
export const registerLogsNotifier = async (
  server: EchoServer,
  {
    logs: { logsNotifier: logsNotifierConfig },
    selfReports: selfReportsConfig,
    notification: notificationConfig
  }: BackConfig,
  logsFilesApi: LogsFilesApi,
  logsRepository: LogsRepository
): Promise<void> => {
  if (logsNotifierConfig === undefined || notificationConfig === undefined) {
    server.log.info('The logs notifier is not configured, skipping its registration')
    return
  }

  await server.register(logsNotifier, {
    logsNotifierConfig,
    logsRepository,
    notifier: createTelegramNotifier(
      createTelegramNotifierApi(notificationConfig),
      notificationConfig
    ),
    checkDateRepository: createFileCheckDateRepository(createFileCheckDateApi(logsNotifierConfig)),
    selfReportRepository: await getSelfReportRepository(
      server,
      logsFilesApi,
      selfReportsConfig,
      ({ logsNotifierSelfReportFileName }) => logsNotifierSelfReportFileName
    )
  })
}

import { filterLogByLevels } from '@echo/utilities'

import type { LogsNotifierConfig } from '../../../../../shared/config/logsNotifierConfig.js'
import type { NotificationsService } from '../../../../notifications/domain/notifications.service.js'
import type { SelfReportRepository } from '../../../../selfReports/domain/selfReport.repository.js'
import type { UnNotifiedLogsRepository } from '../domain/unNotifiedLogs.repository.js'

import { buildNotifierMessage } from './utils/buildNotifierMessage.js'

/** Everything one run of the watched logs check needs. */
export interface WatchedLogsCheck {
  /**
   * Gives the levels that are watched, the name the notification says the logs come from and the
   * zone their dates are shown in.
   */
  logsNotifierConfig: LogsNotifierConfig
  unNotifiedLogsRepository: UnNotifiedLogsRepository
  notificationsService: NotificationsService
  /**
   * Where the check reports the watched logs it could not notify. Missing when the self reports
   * are disabled.
   */
  logsNotifierSelfReportRepository?: SelfReportRepository
}

/**
 * Notifies the watched logs that were not notified yet, then marks them as notified.
 *
 * The logs are those `unNotifiedLogsRepository` gives, a watched log being one whose level is
 * among the `watchedLogsLevels` of `logsNotifierConfig`. Every log it gives is marked as notified,
 * the ones that are not watched too, so a check never looks at a log twice.
 *
 * The notification is one message telling about the watched logs, from the newest to the oldest
 * (see {@link buildNotifierMessage}), with the `serverName` and the `timezone` of
 * `logsNotifierConfig`, built for the size limit of `notificationsService`. Nothing is sent when
 * there is no watched log, nor when the size limit is too small for any message: in the second
 * case a warning is saved to `logsNotifierSelfReportRepository`, when there is one, and the logs
 * are marked as notified all the same, since notifying them again would fail the same way.
 *
 * The logs are not marked as notified when notifying throws, so the next check notifies them
 * again.
 *
 * ```ts
 * await checkWatchedLogsAndNotify({
 *   logsNotifierConfig,
 *   unNotifiedLogsRepository,
 *   notificationsService,
 *   logsNotifierSelfReportRepository
 * })
 * ```
 */
export const checkWatchedLogsAndNotify = async ({
  logsNotifierConfig: { watchedLogsLevels, serverName, timezone },
  unNotifiedLogsRepository,
  notificationsService,
  logsNotifierSelfReportRepository
}: WatchedLogsCheck): Promise<void> => {
  const { logs, markAsNotified } = await unNotifiedLogsRepository.getUnNotifiedLogs()

  const watchedLogs = logs
    .filter((log) => filterLogByLevels(log, watchedLogsLevels))
    .sort(
      (firstLog, secondLog) =>
        new Date(secondLog.date).getTime() - new Date(firstLog.date).getTime()
    )

  if (watchedLogs.length > 0) {
    const messageSizeLimit = notificationsService.getMessageSizeLimit()
    const message = buildNotifierMessage({ messageSizeLimit, watchedLogs, serverName, timezone })

    if (message !== undefined) {
      await notificationsService.notify(message)
    } else if (logsNotifierSelfReportRepository !== undefined) {
      await logsNotifierSelfReportRepository.saveSelfReports([
        {
          date: new Date(),
          message:
            `The watched logs were not notified: the notifier takes messages of ` +
            `${messageSizeLimit} characters at most, which is not enough for any message`,
          level: 'WARNING',
          origin: 'checkWatchedLogsAndNotify'
        }
      ])
    }
  }

  await markAsNotified()
}

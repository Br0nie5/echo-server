import { isLogMatchingLevels } from '@echo/utilities'

import type { LogsNotifierConfig } from '../../../../../shared/config/logsNotifierConfig.js'
import type { NotificationsService } from '../../../../notifications/domain/notifications.service.js'
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
 * `logsNotifierConfig`, built for the size limit `notificationsService` gives. Nothing is sent
 * when there is no watched log.
 *
 * Throws when notifying does, that is when the notification could not be sent or when the size
 * limit is too small for any message. The logs are not marked as notified then, so the next check
 * notifies them again.
 *
 * ```ts
 * await checkWatchedLogsAndNotify({
 *   logsNotifierConfig,
 *   unNotifiedLogsRepository,
 *   notificationsService
 * })
 * ```
 */
export const checkWatchedLogsAndNotify = async ({
  logsNotifierConfig: { watchedLogsLevels, serverName, timezone },
  unNotifiedLogsRepository,
  notificationsService
}: WatchedLogsCheck): Promise<void> => {
  const { logs, markAsNotified } = await unNotifiedLogsRepository.getUnNotifiedLogs()

  const watchedLogs = logs
    .filter((log) => isLogMatchingLevels(log, watchedLogsLevels))
    .sort(
      (firstLog, secondLog) =>
        new Date(secondLog.date).getTime() - new Date(firstLog.date).getTime()
    )

  if (watchedLogs.length > 0) {
    await notificationsService.notify((messageSizeLimit) =>
      buildNotifierMessage({ messageSizeLimit, watchedLogs, serverName, timezone })
    )
  }

  await markAsNotified()
}

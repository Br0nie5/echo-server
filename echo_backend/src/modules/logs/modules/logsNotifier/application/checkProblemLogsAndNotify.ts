import type { LogCategory } from '@echo/utilities'

import type { NotifierService } from '../../../../../shared/services/notifier.service.js'
import type { SelfReportRepository } from '../../../../selfReport/domain/selfReport.repository.js'
import { getFilteredLogs } from '../../../application/getFilteredLogs.js'
import type { LogsRepository } from '../../../domain/logs.repository.js'
import type { CheckDateRepository } from '../domain/checkDate.repository.js'

import { buildNotifierMessage } from './utils/buildNotifierMessage.js'

/** Everything one run of the problem logs check needs. */
export interface ProblemLogsCheck {
  /** Categories that make a log a problem log. */
  watchedLogsCategories: LogCategory[]
  /** Name the notification says the logs come from. */
  serverName: string
  /** Luxon zone the dates of the logs are shown in. */
  timezone: string
  logsRepository: LogsRepository
  /** Where the stored entries that hold no valid log are reported. */
  logsSelfReportRepository: SelfReportRepository
  notifierService: NotifierService
  checkDateRepository: CheckDateRepository
  /** Where the check reports the problem logs it could not notify. */
  selfReportRepository: SelfReportRepository
}

/**
 * Notifies the problem logs logged since the previous check, then saves the date of this one.
 *
 * The logs are looked up with `getFilteredLogs`, which reports the stored entries that hold no
 * valid log to `logsSelfReportRepository`.
 *
 * The notification is one message telling about the logs (see {@link buildNotifierMessage}), built
 * for the size limit of `notifierService`. Nothing is sent when there is no problem log.
 * Nothing is sent either when the size limit is too small for any message: a warning is then saved
 * to `selfReportRepository`, and the date of the check is saved all the same, since notifying the
 * same logs again would fail the same way.
 *
 * The very first check only saves its date, so the logs that predate it are not notified. The date
 * is not saved when notifying throws, so the same logs are notified again by the next check.
 *
 * ```ts
 * await checkProblemLogsAndNotify({
 *   watchedLogsCategories: logsNotifierConfig.watchedLogsCategories,
 *   serverName: logsNotifierConfig.serverName,
 *   timezone: logsNotifierConfig.notifierTimezone,
 *   logsRepository,
 *   logsSelfReportRepository,
 *   notifierService,
 *   checkDateRepository,
 *   selfReportRepository
 * })
 * ```
 */
export async function checkProblemLogsAndNotify({
  watchedLogsCategories,
  serverName,
  timezone,
  logsRepository,
  logsSelfReportRepository,
  notifierService,
  checkDateRepository,
  selfReportRepository
}: ProblemLogsCheck): Promise<void> {
  const previousCheck = await checkDateRepository.getLastCheckDate()

  const now = new Date()

  if (previousCheck === undefined) {
    await checkDateRepository.saveLastCheckDate({ lastCheckDate: now })
    return
  }

  const problemLogs = await getFilteredLogs(logsRepository, logsSelfReportRepository, {
    fromDate: previousCheck.lastCheckDate,
    categories: watchedLogsCategories,
    searchFilters: []
  })

  if (problemLogs.length > 0) {
    const messageSizeLimit = notifierService.getMessageSizeLimit()
    const message = buildNotifierMessage({ messageSizeLimit, problemLogs, serverName, timezone })

    if (message === undefined) {
      await selfReportRepository.saveSelfReports([
        {
          date: now,
          message:
            `The problem logs were not notified: the notifier takes messages of ` +
            `${messageSizeLimit} characters at most, which is not enough for any message`,
          level: 'warning',
          reportedFile: 'checkProblemLogsAndNotify'
        }
      ])
    } else {
      await notifierService.notify(message)
    }
  }

  await checkDateRepository.saveLastCheckDate({ lastCheckDate: now })
}

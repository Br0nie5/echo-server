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
 * A check looks at the logs logged from the date of the previous check to its own, the latter left
 * out: a log is in the period of one check only, so it is notified once, even when it is written
 * while the logs are being read. The logs are looked up with `getFilteredLogs`, which reports the
 * stored entries that hold no valid log to `logsSelfReportRepository`.
 *
 * The self reports are logs too, so they are notified when their category is watched. A stored
 * entry that holds no valid log is reported again each time the logs are read, with the date it is
 * read at: as long as it stays in its file, it is therefore notified at every check. That is on
 * purpose, as dating it from when it was first seen would hide a new problem found on the same
 * line.
 *
 * The notification is one message telling about the logs (see {@link buildNotifierMessage}), built
 * for the size limit of `notifierService`. Nothing is sent when there is no problem log, nor when
 * the size limit is too small for any message: a warning is then saved to `selfReportRepository`,
 * and the date of the check is saved all the same, since notifying the same logs again would fail
 * the same way.
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
export const checkProblemLogsAndNotify = async ({
  watchedLogsCategories,
  serverName,
  timezone,
  logsRepository,
  logsSelfReportRepository,
  notifierService,
  checkDateRepository,
  selfReportRepository
}: ProblemLogsCheck): Promise<void> => {
  const previousCheck = await checkDateRepository.getLastCheckDate()

  const newCheckDate = new Date()

  if (previousCheck === undefined) {
    await checkDateRepository.saveLastCheckDate({ lastCheckDate: newCheckDate })
    return
  }

  const problemLogs = await getFilteredLogs(logsRepository, logsSelfReportRepository, {
    fromDate: previousCheck.lastCheckDate,
    toDate: newCheckDate,
    categories: watchedLogsCategories,
    searchFilters: []
  })

  if (problemLogs.length > 0) {
    const messageSizeLimit = notifierService.getMessageSizeLimit()
    const message = buildNotifierMessage({ messageSizeLimit, problemLogs, serverName, timezone })

    if (message === undefined) {
      await selfReportRepository.saveSelfReports([
        {
          date: newCheckDate,
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

  await checkDateRepository.saveLastCheckDate({ lastCheckDate: newCheckDate })
}

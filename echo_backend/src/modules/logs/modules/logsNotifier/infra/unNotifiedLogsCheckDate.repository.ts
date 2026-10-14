import type { LogsRepository } from '../../../domain/logs.repository.js'
import type {
  UnNotifiedLogs,
  UnNotifiedLogsRepository
} from '../domain/unNotifiedLogs.repository.js'

import type { CheckDateApi } from './checkDateFile.api.js'
import {
  convertLastCheckDateToRawLastCheckDate,
  convertRawLastCheckDateToLastCheckDate
} from './dto/lastCheckDate.dto.js'

/**
 * Builds the `UnNotifiedLogsRepository` that remembers what was notified as a date, the one of the
 * last check, kept in the file behind `checkDateApi`.
 *
 * A read is a check: it gives the logs of `logsRepository` logged from the date of the last check
 * to its own, the latter left out. A log is in the period of one check only, so it is given once,
 * even when it is written while the logs are being read. `markAsNotified` saves the date of its
 * check as the last one.
 *
 * A file that is missing, unreadable or that holds no valid date gives no last check date, the
 * same as when the logs were never checked: the read gives every log logged before its own date.
 *
 * ```ts
 * const unNotifiedLogsRepository = createUnNotifiedLogsCheckDateRepository(
 *   logsRepository,
 *   createCheckDateFileApi({ lastLogsCheckFilePath }, filesService)
 * )
 * ```
 */
export const createUnNotifiedLogsCheckDateRepository = (
  logsRepository: LogsRepository,
  checkDateApi: CheckDateApi
): UnNotifiedLogsRepository => {
  const getLastCheckDate = async (): Promise<Date | undefined> => {
    let rawLastCheckDate: string

    try {
      rawLastCheckDate = await checkDateApi.getRawLastCheckDate()
    } catch {
      return undefined
    }

    return convertRawLastCheckDateToLastCheckDate(rawLastCheckDate)
  }

  return {
    getUnNotifiedLogs: async (): Promise<UnNotifiedLogs> => {
      const lastCheckDate = await getLastCheckDate()
      const checkDate = new Date()

      const markAsNotified = (): Promise<void> =>
        checkDateApi.saveRawLastCheckDate(convertLastCheckDateToRawLastCheckDate(checkDate))

      const logs = await logsRepository.getAllLogs()

      return {
        logs: logs.filter((log) => {
          const logTime = new Date(log.date).getTime()

          return (
            (lastCheckDate === undefined || logTime >= lastCheckDate.getTime()) &&
            logTime < checkDate.getTime()
          )
        }),
        markAsNotified
      }
    }
  }
}

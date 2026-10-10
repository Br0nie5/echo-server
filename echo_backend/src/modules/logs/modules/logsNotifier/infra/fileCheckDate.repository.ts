import type { CheckDateRepository } from '../domain/checkDate.repository.js'
import type { LastCheckDate } from '../domain/lastCheckDate.js'

import {
  convertLastCheckDateToRawLastCheckDate,
  convertRawLastCheckDateToLastCheckDate
} from './dto/lastCheckDate.dto.js'
import type { CheckDateApi } from './fileCheckDate.api.js'

/**
 * Builds the `CheckDateRepository` that keeps the last check date in the file behind
 * `checkDateApi`.
 *
 * A file that is missing, unreadable or that holds no valid date gives no last check date, the
 * same as when the logs were never checked.
 *
 * ```ts
 * const checkDateRepository = createFileCheckDateRepository(
 *   createFileCheckDateApi(logsNotifierConfig, filesService)
 * )
 * ```
 */
export const createFileCheckDateRepository = (checkDateApi: CheckDateApi): CheckDateRepository => ({
  getLastCheckDate: async (): Promise<LastCheckDate | undefined> => {
    let rawLastCheckDate: string

    try {
      rawLastCheckDate = await checkDateApi.getRawLastCheckDate()
    } catch {
      return undefined
    }

    return convertRawLastCheckDateToLastCheckDate(rawLastCheckDate)
  },

  saveLastCheckDate: (lastCheckDate): Promise<void> =>
    checkDateApi.saveRawLastCheckDate(convertLastCheckDateToRawLastCheckDate(lastCheckDate))
})

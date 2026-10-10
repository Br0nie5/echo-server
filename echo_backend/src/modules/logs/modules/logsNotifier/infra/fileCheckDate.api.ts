import path from 'path'

import type { LogsNotifierConfig } from '../../../../../shared/config/backConfig.js'
import type { FilesService } from '../../../../../shared/services/files.service.js'

/** Access to the last-check file, the data source the last check date is stored in. */
export interface CheckDateApi {
  /**
   * The content of the last-check file.
   *
   * Throws when the file does not exist or cannot be read.
   */
  getRawLastCheckDate: () => Promise<string>
  /**
   * Makes `rawLastCheckDate` the whole content of the last-check file, creating the directory of
   * the file when it does not exist yet.
   */
  saveRawLastCheckDate: (rawLastCheckDate: string) => Promise<void>
}

/**
 * Builds the access to the last-check file, found at `lastLogsCheckFilePath`, read and written
 * through `filesService`.
 *
 * ```ts
 * const checkDateApi = createFileCheckDateApi(logsNotifierConfig, filesService)
 * const rawLastCheckDate = await checkDateApi.getRawLastCheckDate()
 * ```
 */
export const createFileCheckDateApi = (
  { lastLogsCheckFilePath }: LogsNotifierConfig,
  filesService: FilesService
): CheckDateApi => ({
  getRawLastCheckDate: (): Promise<string> => filesService.getFileContent(lastLogsCheckFilePath),

  saveRawLastCheckDate: async (rawLastCheckDate): Promise<void> => {
    await filesService.createDirectory(path.dirname(lastLogsCheckFilePath))
    await filesService.replaceFileContent(lastLogsCheckFilePath, rawLastCheckDate)
  }
})

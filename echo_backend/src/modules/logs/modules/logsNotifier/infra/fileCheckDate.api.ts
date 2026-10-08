import nodeFs from 'fs/promises'
import path from 'path'

import type { LogsNotifierConfig } from '../../../../../shared/config/backConfig.js'

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

/** The subset of `fs/promises` used, so it can be replaced in tests. */
export type CheckDateFileSystem = Pick<typeof nodeFs, 'mkdir' | 'readFile' | 'writeFile'>

/**
 * Builds the access to the last-check file, found at `lastLogsCheckFilePath`, on top of
 * `fileSystem` (the real file system by default).
 */
export const createFileCheckDateApi = (
  { lastLogsCheckFilePath }: LogsNotifierConfig,
  fileSystem: CheckDateFileSystem = nodeFs
): CheckDateApi => ({
  getRawLastCheckDate: (): Promise<string> => fileSystem.readFile(lastLogsCheckFilePath, 'utf-8'),

  saveRawLastCheckDate: async (rawLastCheckDate): Promise<void> => {
    await fileSystem.mkdir(path.dirname(lastLogsCheckFilePath), { recursive: true })
    await fileSystem.writeFile(lastLogsCheckFilePath, rawLastCheckDate, 'utf-8')
  }
})

import path from 'path'

import { FileDoesNotExistError } from '../../../shared/services/fileDoesNotExistError.js'
import type { FilesService } from '../../../shared/services/files.service.js'

/** Access to the self-report files, the data source the self reports are stored in. */
export interface SelfReportsFilesApi {
  /**
   * The path of the self-report file at `filePath` from the root of the file system: its
   * directories, then its name, separated by `/`.
   *
   * Returns `undefined` when `filePath` is the root of the file system itself.
   */
  getSelfReportFilePathFromRoot: (filePath: string) => string | undefined
  /**
   * The non-blank lines of the self-report file at `filePath`, in the order they were written.
   *
   * A file that does not exist has no line. Throws when the file exists but cannot be read.
   */
  getSelfReportLines: (filePath: string) => Promise<string[]>
  /**
   * Makes the lines of the self-report file at `filePath` those `update` makes of its current ones,
   * none for a missing file, creating the file and its directory when they do not exist yet.
   *
   * No other update of the file happens until the lines of this one are written, so none loses the
   * lines of another. `update` leaves the file as it is by returning `undefined`. The file changes
   * in one step: whoever reads it meanwhile gets either its previous lines or the new ones. Throws
   * when the file cannot be read or written, or when `update` throws.
   */
  updateSelfReportLines: (
    filePath: string,
    update: (currentLines: string[]) => string[] | undefined
  ) => Promise<void>
}

/**
 * Builds the access to the self-report files, read and written through `filesService`.
 *
 * ```ts
 * const selfReportsFilesApi = createSelfReportsFilesApi(filesService)
 * const lines = await selfReportsFilesApi.getSelfReportLines('/self_reports/Echo/parseLogs.jsonl')
 * ```
 */
export const createSelfReportsFilesApi = (filesService: FilesService): SelfReportsFilesApi => ({
  getSelfReportFilePathFromRoot: (filePath): string | undefined =>
    filesService.getRelativeFilePath(filePath),

  getSelfReportLines: async (filePath): Promise<string[]> => {
    try {
      return await filesService.getFileLines(filePath)
    } catch (error) {
      if (error instanceof FileDoesNotExistError) {
        return []
      }
      throw error
    }
  },

  updateSelfReportLines: async (filePath, update): Promise<void> => {
    await filesService.createDirectory(path.dirname(filePath))
    await filesService.replaceFileLines(filePath, update)
  }
})

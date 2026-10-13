import path from 'path'

import { FileDoesNotExistError } from '../../../shared/services/fileDoesNotExistError.js'
import type { FilesService } from '../../../shared/services/files.service.js'

/** Access to the self-report files, the data source the self reports are stored in. */
export interface SelfReportsFilesApi {
  /**
   * The path of every self-report file of the self-reports directory, at any depth.
   *
   * Throws when the directory does not exist or cannot be read.
   */
  getAllSelfReportFilesPaths: () => Promise<string[]>
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
   * Makes `lines` the lines of the self-report file at `filePath`, in the order they are given,
   * creating the file and its directory when they do not exist yet.
   *
   * The file changes in one step: whoever reads it meanwhile gets either its previous lines or the
   * new ones. Throws when the file cannot be written.
   */
  saveSelfReportLines: (filePath: string, lines: string[]) => Promise<void>
}

/**
 * Builds the access to the self-report files, read and written through `filesService`.
 *
 * The self-report files it lists are the files of `selfReportsDirPath` whose name ends with
 * `selfReportFileExtension`:
 *
 * ```ts
 * const selfReportsFilesApi = createSelfReportsFilesApi(
 *   { selfReportsDirPath: '/self_reports/Echo', selfReportFileExtension: '.jsonl' },
 *   filesService
 * )
 * const [filePath] = await selfReportsFilesApi.getAllSelfReportFilesPaths()
 * const lines = await selfReportsFilesApi.getSelfReportLines(filePath)
 * ```
 */
export const createSelfReportsFilesApi = (
  {
    selfReportsDirPath,
    selfReportFileExtension
  }: { selfReportsDirPath: string; selfReportFileExtension: string },
  filesService: FilesService
): SelfReportsFilesApi => ({
  getAllSelfReportFilesPaths: (): Promise<string[]> =>
    filesService.getFilesPaths(selfReportsDirPath, (filePath) =>
      filePath.endsWith(selfReportFileExtension)
    ),

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

  saveSelfReportLines: async (filePath, lines): Promise<void> => {
    await filesService.createDirectory(path.dirname(filePath))
    await filesService.replaceFileLines(filePath, lines)
  }
})

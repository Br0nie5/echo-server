import path from 'path'

import { FileDoesNotExistError } from '../../../shared/services/fileDoesNotExistError.js'
import type { FilesService } from '../../../shared/services/files.service.js'
import { createSnakeCaseName } from '../../../shared/utils/createSnakeCaseName.js'

import type { LogFileDto } from './dto/logFile.dto.js'
import type { RawLogLineDto } from './dto/rawLogLine.dto.js'

/** Access to the log files, the data source the logs are stored in. */
export interface LogsFilesApi {
  /**
   * Every log file of the logs directory, at any depth.
   *
   * The location name of a log file is its name without its extension. Its group is made of the
   * directories between the logs directory and the file, without those named `logFilesDirName` nor
   * the first of the others, each in lower case with its spaces replaced with `_`, joined with `_`:
   * it has none when no directory is left.
   *
   * Throws when the logs directory cannot be read.
   */
  getAllLogFiles: () => Promise<LogFileDto[]>
  /**
   * The non-blank lines of `logFile`, in the order they were written, each with its position.
   *
   * A file that does not exist has no line. Throws when the file exists but cannot be read.
   */
  getRawLogLines: (logFile: LogFileDto) => Promise<RawLogLineDto[]>
}

/** Where {@link createLogsFilesApi} finds the log files. */
export interface LogsFilesLocation {
  /** Directory the log files are read from, at any depth. */
  logsDirPath: string
  /** Extension, with its dot, a file of `logsDirPath` must have to be read as a log file. */
  logFileExtension: string
  /** Name of the directories that only hold log files, left out of the group of a log file. */
  logFilesDirName: string
}

/**
 * Builds the access to the log files, read through `filesService`.
 *
 * The log files it lists are the files of `logsDirPath` whose name ends with `logFileExtension`.
 * `logFilesDirName` is the name of the directories left out of the group of a log file:
 *
 * ```ts
 * const logsFilesApi = createLogsFilesApi(
 *   { logsDirPath: '/watched_logs', logFileExtension: '.jsonl', logFilesDirName: 'logs' },
 *   filesService
 * )
 * const logFiles = await logsFilesApi.getAllLogFiles()
 * const rawLogLines = await logsFilesApi.getRawLogLines(logFiles[0])
 * ```
 */
export const createLogsFilesApi = (
  { logsDirPath, logFileExtension, logFilesDirName }: LogsFilesLocation,
  filesService: FilesService
): LogsFilesApi => {
  const createLogFileGroupName = (filePath: string): string | undefined =>
    createSnakeCaseName(
      filesService
        .getRelativeFilePath(filePath, logsDirPath)
        ?.split('/')
        .filter((pathPart) => pathPart !== logFilesDirName)
        .slice(1, -1) ?? []
    )

  return {
    getAllLogFiles: async (): Promise<LogFileDto[]> => {
      const logFilesPaths = await filesService.getFilesPaths(logsDirPath, (filePath) =>
        filePath.endsWith(logFileExtension)
      )

      return logFilesPaths.map((filePath) => ({
        path: filePath,
        locationName: path.basename(filePath, path.extname(filePath)),
        groupName: createLogFileGroupName(filePath)
      }))
    },

    getRawLogLines: async (logFile): Promise<RawLogLineDto[]> => {
      try {
        const lines = await filesService.getFileLines(logFile.path)
        return lines.map((content, index) => ({ logFile, index, content }))
      } catch (error) {
        if (error instanceof FileDoesNotExistError) {
          return []
        }
        throw error
      }
    }
  }
}

import path from 'path'

import type { LogsConfig } from '../../../shared/config/backConfig.js'
import type { FilesService } from '../../../shared/services/files.service.js'

import type { LogFileDto } from './dto/logFile.dto.js'
import type { RawLogLineDto } from './dto/rawLogLine.dto.js'

/** Access to the log files, the data source the logs are stored in. */
export interface LogsFilesApi {
  /**
   * Every log file of the logs directories, at any depth, one directory after the other.
   *
   * Throws when one of the logs directories cannot be read.
   */
  getAllLogFiles: () => Promise<LogFileDto[]>
  /**
   * The log file at `filePath`, whether it exists yet or not.
   *
   * Its name is the name of the file without its extension. Its group is made of the directories
   * between the first one under its logs directory and the file, joined with `_` (a directory
   * named `logFilesDirName` is skipped), and is `undefined` when there is none, or when the file is in none of
   * the logs directories.
   */
  getLogFile: (filePath: string) => LogFileDto
  /**
   * The non-blank lines of `logFile`, in the order they were written, each with its position.
   *
   * A file that does not exist has no line. Throws when the file exists but cannot be read.
   */
  getRawLogLines: (logFile: LogFileDto) => Promise<RawLogLineDto[]>
  /**
   * Makes `rawLogLines` the lines of `logFile`, in the order they are given, creating the file and
   * its directory when they do not exist yet.
   *
   * The file changes in one step: whoever reads it meanwhile gets either its previous lines or the
   * new ones. Throws when the file cannot be written.
   */
  saveRawLogLines: (logFile: LogFileDto, rawLogLines: RawLogLineDto[]) => Promise<void>
}

/**
 * Builds the access to the log files, read and written through `filesService`.
 *
 * The log files it lists are the files of each directory of `logsDirsPaths` whose name ends with
 * `logFileExtension`. `logFilesDirName` is the name of the directories left out of the group of a
 * log file:
 *
 * ```ts
 * const logsFilesApi = createLogsFilesApi(config.logs, createFilesService())
 * const logFiles = await logsFilesApi.getAllLogFiles()
 * const rawLogLines = await logsFilesApi.getRawLogLines(logFiles[0])
 * ```
 */
export const createLogsFilesApi = (
  { logsDirsPaths, logFileExtension, logFilesDirName }: LogsConfig,
  filesService: FilesService
): LogsFilesApi => {
  const buildLogFileDto = (filePath: string, logsDirPath: string | undefined): LogFileDto => {
    const directoriesLinkedName =
      logsDirPath !== undefined
        ? path
            .relative(logsDirPath, filePath)
            .split(path.sep)
            .filter((part) => part !== logFilesDirName)
            .slice(1, -1)
            .join('_')
        : ''

    return {
      path: filePath,
      fileName: path.basename(filePath, path.extname(filePath)),
      groupName: directoriesLinkedName !== '' ? directoriesLinkedName : undefined
    }
  }

  return {
    getAllLogFiles: async (): Promise<LogFileDto[]> =>
      (
        await Promise.all(
          logsDirsPaths.map(async (logsDirPath: string) => {
            const logFilesPaths = await filesService.getFilesPaths(logsDirPath, (filePath) =>
              filePath.endsWith(logFileExtension)
            )

            return logFilesPaths.map((filePath) => buildLogFileDto(filePath, logsDirPath))
          })
        )
      ).flat(),

    getLogFile: (filePath): LogFileDto =>
      buildLogFileDto(
        filePath,
        logsDirsPaths.find((logsDirPath) => {
          const relativePath = path.relative(logsDirPath, filePath)
          const isInDirectory = !relativePath.startsWith('..') && !path.isAbsolute(relativePath)

          return isInDirectory
        })
      ),

    getRawLogLines: async (logFile): Promise<RawLogLineDto[]> =>
      (await filesService.getFileLines(logFile.path)).map((content, index) => ({
        logFile,
        index,
        content
      })),

    saveRawLogLines: async (logFile, rawLogLines): Promise<void> => {
      await filesService.createDirectory(path.dirname(logFile.path))
      await filesService.replaceFileLines(
        logFile.path,
        rawLogLines.map(({ content }) => content)
      )
    }
  }
}

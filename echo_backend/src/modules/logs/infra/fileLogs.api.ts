import { constants as fsConstants } from 'fs'
import nodeFs from 'fs/promises'
import path from 'path'

import type { EchoError } from '@echo/utilities'

import type { LogFileDto } from './dto/logFile.dto.js'
import type { RawLogLineDto } from './dto/rawLogLine.dto.js'

const LOG_FILE_EXTENSION = '.jsonl'

/** Access to the log files, the data source the logs are stored in. */
export interface FileLogsApi {
  /** The path of every log file of the logs directory, at any depth. */
  getAllLogFilesPaths: () => Promise<string[]>
  /**
   * The log file found at `filePath`.
   *
   * Its name is the name of the file without its extension. Its group is made of the directories
   * between the first one under the logs directory and the file, joined with `_` (a `log`
   * directory is skipped), and is `undefined` when there is none.
   */
  getAllLogsFromFile: (filePath: string) => LogFileDto
  /** Every log file of the logs directory, at any depth. */
  getAllLogsFromFiles: () => Promise<LogFileDto[]>
  /**
   * The non-blank lines of `logFile`, in the order they were written.
   *
   * Throws an `EchoError` (500) when the file does not exist or cannot be read.
   */
  getRawLogLines: (logFile: LogFileDto) => Promise<RawLogLineDto[]>
}

/** The subset of `fs/promises` used, so it can be replaced in tests. */
export type FileSystem = Pick<typeof nodeFs, 'readdir' | 'access' | 'readFile'>

/**
 * Builds the access to the `.jsonl` files found under `logsDirPath`, on top of `fileSystem` (the
 * real file system by default).
 */
export const createFileLogsApi = (
  logsDirPath: string,
  fileSystem: FileSystem = nodeFs
): FileLogsApi => {
  const getAllFilesPaths = async (directory: string): Promise<string[]> => {
    const entries = await fileSystem.readdir(directory, { withFileTypes: true })

    const filesPathsByEntry = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(directory, entry.name)

        if (entry.isDirectory()) {
          return getAllFilesPaths(entryPath)
        }

        return entry.isFile() ? [entryPath] : []
      })
    )

    return filesPathsByEntry.flat()
  }

  const getAllLogFilesPaths = async (): Promise<string[]> =>
    (await getAllFilesPaths(logsDirPath)).filter((filePath) =>
      filePath.endsWith(LOG_FILE_EXTENSION)
    )

  const getAllLogsFromFile = (filePath: string): LogFileDto => {
    const directoriesLinkedName = filePath
      .replace(`${logsDirPath}/`, '')
      .split('/')
      .filter((part) => part.length !== 0 && part !== 'log')
      .slice(1, -1)
      .join('_')

    return {
      path: filePath,
      fileName: path.basename(filePath, path.extname(filePath)),
      groupName: directoriesLinkedName !== '' ? directoriesLinkedName : undefined
    }
  }

  return {
    getAllLogFilesPaths,

    getAllLogsFromFile,

    getAllLogsFromFiles: async (): Promise<LogFileDto[]> =>
      (await getAllLogFilesPaths()).map(getAllLogsFromFile),

    getRawLogLines: async (logFile): Promise<RawLogLineDto[]> => {
      await fileSystem.access(logFile.path, fsConstants.F_OK | fsConstants.R_OK).catch(() => {
        const error: EchoError = {
          statusCode: 500,
          message: `The file (${logFile.path}) does not exist or is not readable`
        }
        throw error
      })

      return (await fileSystem.readFile(logFile.path, 'utf-8'))
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((content, index) => ({ logFile, index, content }))
    }
  }
}

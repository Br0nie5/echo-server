import { constants as fsConstants } from 'fs'
import nodeFs from 'fs/promises'
import path from 'path'

import type { LogsConfig } from '../../../shared/config/backConfig.js'
import { convertToDateFromISO } from '../../../shared/utils/convertToDate.js'

import type { LogFileDto } from './dto/logFile.dto.js'
import { RawJsonLogLineSchema, type RawJsonLogLine } from './dto/rawJsonLog.dto.js'
import type { RawLogLineDto } from './dto/rawLogLine.dto.js'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/** Access to the log files, the data source the logs are stored in. */
export interface LogsFilesApi {
  /**
   * Every log file of the logs directories, at any depth, one directory after the other.
   *
   * The name of a log file is the name of the file without its extension. Its group is made of the
   * directories between the first one under its logs directory and the file, joined with `_` (a
   * `log` directory is skipped), and is `undefined` when there is none. Throws when one of the
   * logs directories cannot be read.
   */
  getAllLogFiles: () => Promise<LogFileDto[]>
  /**
   * The non-blank lines of `logFile`, in the order they were written, each with its position.
   *
   * A file that does not exist has no line. Throws when the file exists but cannot be read.
   */
  getRawLogLines: (logFile: LogFileDto) => Promise<RawLogLineDto[]>
  /** Creates the directory at `directoryPath`, and its parents, when they do not exist yet. */
  createDirectory: (directoryPath: string) => Promise<void>
  /**
   * Removes from the log file at `logFilePath` the lines written more than `retentionDays` days ago.
   *
   * A line is dated by the `timestamp` of the `RawJsonLogLine` it holds. A line that holds none, or
   * whose `timestamp` is not a date, is not a valid log line and is removed too. The file changes
   * in one step: whoever reads it meanwhile gets either its previous content or the new one, never
   * a part of it. It is left untouched when it has no line to remove, and a file that does not
   * exist yet has none. Throws when the file cannot be read or written.
   */
  rotateLogFile: (logFilePath: string, retentionDays: number) => Promise<void>
  /**
   * Removes from the log file at `logFilePath` every line holding a `RawJsonLogLine` that
   * `isLogLineToDelete` returns `true` for.
   *
   * A line that holds no `RawJsonLogLine` is not a valid log line and is removed too. The file
   * changes in one step, like with `rotateLogFile`, and is left untouched when it has no line to
   * remove. A file that does not exist yet has none. Throws when the file cannot be read or
   * written.
   *
   * ```ts
   * await logsFilesApi.deleteLogFileSelectedLines(logFilePath, ({ job_id }) => job_id === 3)
   * ```
   */
  deleteLogFileSelectedLines: (
    logFilePath: string,
    isLogLineToDelete: (rawJsonLogLine: RawJsonLogLine) => boolean
  ) => Promise<void>
  /**
   * Adds `rawJsonLogLines` at the end of the log file at `logFilePath`, one line each, in a single
   * write. The file is created when it does not exist yet.
   */
  appendLogFileLines: (logFilePath: string, rawJsonLogLines: RawJsonLogLine[]) => Promise<void>
}

/** The subset of `fs/promises` used, so it can be replaced in tests. */
export type FileSystem = Pick<
  typeof nodeFs,
  'readdir' | 'access' | 'readFile' | 'mkdir' | 'writeFile' | 'rename' | 'appendFile'
>

/**
 * Builds the access to the log files, on top of `fileSystem` (the real file system by default).
 *
 * The log files it lists are the files of each directory of `logsDirsPaths` whose name ends with
 * `logFileExtension`. The ones it writes are given by their path:
 *
 * ```ts
 * const logsFilesApi = createLogsFilesApi(config.logs)
 * const logFiles = await logsFilesApi.getAllLogFiles()
 * await logsFilesApi.appendLogFileLines('/server_logs/self_reports/Echo/log/parseLogFile.jsonl', [rawJsonLogLine])
 * ```
 */
export const createLogsFilesApi = (
  { logsDirsPaths, logFileExtension }: LogsConfig,
  fileSystem: FileSystem = nodeFs
): LogsFilesApi => {
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

  const getLogFile = (filePath: string, logsDirPath: string): LogFileDto => {
    const directoriesLinkedName = path
      .relative(logsDirPath, filePath)
      .split(path.sep)
      .filter((part) => part !== 'log')
      .slice(1, -1)
      .join('_')

    return {
      path: filePath,
      fileName: path.basename(filePath, path.extname(filePath)),
      groupName: directoriesLinkedName !== '' ? directoriesLinkedName : undefined
    }
  }

  const splitNonBlankLines = (content: string): string[] =>
    content.split('\n').filter((line) => line.trim() !== '')

  const joinLines = (lines: string[]): string => lines.map((line) => `${line}\n`).join('')

  const getFileLines = async (filePath: string): Promise<string[]> => {
    const doesFileExist = await fileSystem.access(filePath, fsConstants.F_OK).then(
      () => true,
      () => false
    )
    if (!doesFileExist) {
      return []
    }

    await fileSystem.access(filePath, fsConstants.R_OK)

    return splitNonBlankLines(await fileSystem.readFile(filePath, 'utf-8'))
  }

  const replaceFileLines = async (filePath: string, lines: string[]): Promise<void> => {
    // The log files are read at any time: writing into the file itself would let a reader see it
    // half written, and report its cut line as a line it cannot parse.
    const temporaryFilePath = `${filePath}.tmp`

    await fileSystem.writeFile(temporaryFilePath, joinLines(lines), 'utf-8')
    await fileSystem.rename(temporaryFilePath, filePath)
  }

  const parseRawJsonLogLine = (line: string): RawJsonLogLine | undefined => {
    try {
      return RawJsonLogLineSchema.safeParse(JSON.parse(line)).data
    } catch {
      return undefined
    }
  }

  const deleteLogFileSelectedLines = async (
    logFilePath: string,
    isLogLineToDelete: (rawJsonLogLine: RawJsonLogLine) => boolean
  ): Promise<void> => {
    const lines = await getFileLines(logFilePath)
    const remainingLines = lines.filter((line) => {
      const rawJsonLogLine = parseRawJsonLogLine(line)

      return rawJsonLogLine !== undefined && !isLogLineToDelete(rawJsonLogLine)
    })

    if (remainingLines.length < lines.length) {
      await replaceFileLines(logFilePath, remainingLines)
    }
  }

  const getAllDirLogFiles = async (logsDirPath: string): Promise<LogFileDto[]> =>
    (await getAllFilesPaths(logsDirPath))
      .filter((filePath) => filePath.endsWith(logFileExtension))
      .map((filePath) => getLogFile(filePath, logsDirPath))

  return {
    getAllLogFiles: async (): Promise<LogFileDto[]> =>
      (await Promise.all(logsDirsPaths.map(getAllDirLogFiles))).flat(),

    getRawLogLines: async (logFile): Promise<RawLogLineDto[]> =>
      (await getFileLines(logFile.path)).map((content, index) => ({ logFile, index, content })),

    createDirectory: async (directoryPath): Promise<void> => {
      await fileSystem.mkdir(directoryPath, { recursive: true })
    },

    rotateLogFile: async (logFilePath, retentionDays): Promise<void> => {
      const retentionTime = Date.now() - retentionDays * MILLISECONDS_PER_DAY

      await deleteLogFileSelectedLines(logFilePath, ({ timestamp }) => {
        const date = convertToDateFromISO(timestamp)

        return date === undefined || date.getTime() < retentionTime
      })
    },

    deleteLogFileSelectedLines,

    appendLogFileLines: (logFilePath, rawJsonLogLines): Promise<void> =>
      fileSystem.appendFile(
        logFilePath,
        joinLines(rawJsonLogLines.map((rawJsonLogLine) => JSON.stringify(rawJsonLogLine))),
        'utf-8'
      )
  }
}

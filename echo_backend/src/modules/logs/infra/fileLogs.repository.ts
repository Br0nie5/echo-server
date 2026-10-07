import { LogCategory, type Log } from '@echo/utilities'

import type { LogsRepository } from '../domain/logs.repository.js'
import type { SelfLog } from '../modules/selfLog/domain/selfLog.js'
import type { SelfLogRepository } from '../modules/selfLog/domain/selfLog.repository.js'

import type { LogFileDto } from './dto/logFile.dto.js'
import { convertRawLogLineToLog } from './dto/rawLogLine.dto.js'
import type { FileLogsApi } from './fileLogs.api.js'

/**
 * Name of the file the lines that hold no log are reported to.
 *
 * It is what the `SelfLogRepository` given to {@link createFileLogsRepository} is created with.
 */
export const PARSE_LOG_FILE_SELF_LOG_FILE_NAME = 'parseLogFile.jsonl'

/** What reading a log file gives: the logs it holds, and a warning for each line that holds none. */
interface ParsedLogFile {
  logs: Log[]
  parseFailures: SelfLog[]
}

/**
 * Builds the `LogsRepository` that takes its logs from the files given by `fileLogsApi`.
 *
 * The lines that hold no valid log are left out and reported to `selfLogRepository` as warnings,
 * those of every file in a single save: the message is the line itself, `callFile` the name of its
 * file and `callLine` its position among the non-blank lines of that file, starting at 1.
 */
export const createFileLogsRepository = (
  fileLogsApi: FileLogsApi,
  selfLogRepository: SelfLogRepository
): LogsRepository => {
  const parseLogFile = async (logFile: LogFileDto): Promise<ParsedLogFile> => {
    const logs: Log[] = []
    const parseFailures: SelfLog[] = []

    const rawLogLines = await fileLogsApi.getRawLogLines(logFile)

    for (const rawLogLine of rawLogLines) {
      const log = convertRawLogLineToLog(rawLogLine)

      if (log === undefined) {
        parseFailures.push({
          category: LogCategory.WARNING,
          message: rawLogLine.content,
          callFile: logFile.fileName,
          callLine: rawLogLine.index + 1
        })
      } else {
        logs.push(log)
      }
    }

    return { logs, parseFailures }
  }

  return {
    findAllLogs: async (): Promise<Log[]> => {
      const logFiles = await fileLogsApi.getAllLogsFromFiles()
      const parsedLogFiles = await Promise.all(logFiles.map(parseLogFile))

      await selfLogRepository.saveSelfLogs(
        parsedLogFiles.flatMap(({ parseFailures }) => parseFailures)
      )

      return parsedLogFiles.flatMap(({ logs }) => logs)
    }
  }
}

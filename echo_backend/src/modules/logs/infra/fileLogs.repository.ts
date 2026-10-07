import type { Log } from '@echo/utilities'

import type { LogsRepository } from '../domain/logs.repository.js'
import type { FailedLogLine, SelfLogsWriter } from '../selfLogs/selfLogs.writer.js'

import type { LogFileDto } from './dto/logFile.dto.js'
import { convertRawLogLineToLog } from './dto/rawLogLine.dto.js'
import type { FileLogsApi } from './fileLogs.api.js'

/** Name of the file the lines that hold no log are reported to, under the self-logs directory. */
const SELF_LOG_FILE_NAME = 'parseLogFile.jsonl'

/**
 * Builds the `LogsRepository` that takes its logs from the files given by `fileLogsApi`.
 *
 * The lines that hold no valid log are left out and reported to `selfLogsWriter`, unless their file
 * is itself a self-log: reporting the failures of a self-log into the self-logs would be a
 * feedback loop.
 */
export const createFileLogsRepository = (
  fileLogsApi: FileLogsApi,
  selfLogsWriter: SelfLogsWriter
): LogsRepository => {
  const findAllLogsInFile = async (logFile: LogFileDto): Promise<Log[]> => {
    const logs: Log[] = []
    const failedLines: FailedLogLine[] = []

    const rawLogLines = await fileLogsApi.getRawLogLines(logFile)

    for (const rawLogLine of rawLogLines) {
      const log = convertRawLogLineToLog(rawLogLine)

      if (log === undefined) {
        failedLines.push({ rawLogLine: rawLogLine.content, lineIndex: rawLogLine.index + 1 })
      } else {
        logs.push(log)
      }
    }

    if (!selfLogsWriter.isSelfLogFile(logFile.path)) {
      await selfLogsWriter.logParseFailures(failedLines, SELF_LOG_FILE_NAME, logFile.fileName)
    }

    return logs
  }

  return {
    findAllLogs: async (): Promise<Log[]> => {
      const logFiles = await fileLogsApi.getAllLogsFromFiles()

      return (await Promise.all(logFiles.map(findAllLogsInFile))).flat()
    }
  }
}

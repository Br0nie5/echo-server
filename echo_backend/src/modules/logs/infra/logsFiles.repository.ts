import type { Log } from '@echo/utilities'

import type { SelfReport } from '../../selfReport/domain/selfReport.js'
import type { SelfReportRepository } from '../../selfReport/domain/selfReport.repository.js'
import type { LogsRepository } from '../domain/logs.repository.js'

import type { LogFileDto } from './dto/logFile.dto.js'
import { convertRawLogLineToLog } from './dto/rawLogLine.dto.js'
import type { LogsFilesApi } from './logsFiles.api.js'

/** What reading a log file gives: the logs it holds, and a warning for each line that holds none. */
interface ParsedLogFile {
  logs: Log[]
  parseFailures: SelfReport[]
}

/**
 * Builds the `LogsRepository` that takes its logs from the files given by `logsFilesApi`.
 *
 * The lines that hold no valid log are left out and reported to `selfReportRepository` as warnings,
 * those of every file in a single save: the message is the line itself, `reportedFile` the name of
 * its file and `reportedLine` its position among the non-blank lines of that file, starting at 1.
 * They are all dated from when the files were read.
 */
export const createLogsFilesRepository = (
  logsFilesApi: LogsFilesApi,
  selfReportRepository: SelfReportRepository
): LogsRepository => {
  const parseLogFile = async (logFile: LogFileDto, readDate: Date): Promise<ParsedLogFile> => {
    const logs: Log[] = []
    const parseFailures: SelfReport[] = []

    const rawLogLines = await logsFilesApi.getRawLogLines(logFile)

    for (const rawLogLine of rawLogLines) {
      const log = convertRawLogLineToLog(rawLogLine)

      if (log === undefined) {
        parseFailures.push({
          date: readDate,
          message: rawLogLine.content,
          level: 'warning',
          reportedFile: logFile.fileName,
          reportedLine: rawLogLine.index + 1
        })
      } else {
        logs.push(log)
      }
    }

    return { logs, parseFailures }
  }

  return {
    findAllLogs: async (): Promise<Log[]> => {
      const readDate = new Date()
      const logFiles = await logsFilesApi.getAllLogFiles()
      const parsedLogFiles = await Promise.all(
        logFiles.map((logFile) => parseLogFile(logFile, readDate))
      )

      await selfReportRepository.saveSelfReports(
        parsedLogFiles.flatMap(({ parseFailures }) => parseFailures)
      )

      return parsedLogFiles.flatMap(({ logs }) => logs)
    }
  }
}

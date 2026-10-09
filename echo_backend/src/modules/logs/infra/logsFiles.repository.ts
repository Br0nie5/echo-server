import type { Log } from '@echo/utilities'

import type { SelfReport } from '../../selfReport/domain/selfReport.js'
import type { FoundLogs, LogsRepository } from '../domain/logs.repository.js'

import type { LogFileDto } from './dto/logFile.dto.js'
import { convertLogToRawJsonLogLine } from './dto/rawJsonLog.dto.js'
import { convertRawLogLineToLog } from './dto/rawLogLine.dto.js'
import type { LogsFilesApi } from './logsFiles.api.js'

/**
 * Builds the `LogsRepository` that keeps its logs in the files given by `logsFilesApi`.
 *
 * A location is the path of a log file, and the locations it watches are the log files of the logs
 * directories. Each log is one line of its file, which holds neither its `id`, its `locationName`
 * nor its `groupName`: those of a log that is saved are not stored, and come from the path of the
 * file when it is read back. The logs that are saved are written from the oldest to the newest,
 * as if each had been added at the end of its file when it was logged; those with the same date
 * keep the order they are given in. A location with nothing stored at is an empty file.
 *
 * The lines that hold no valid log are left out of the logs, and given as warning self reports:
 * the message is the line itself, `reportedFile` the name of its file and `reportedLine` its
 * position among the non-blank lines of that file, starting at 1. Each is dated from when its line
 * was found to hold no log.
 */
export const createLogsFilesRepository = (logsFilesApi: LogsFilesApi): LogsRepository => {
  const parseLogFile = async (logFile: LogFileDto): Promise<FoundLogs> => {
    const logs: Log[] = []
    const selfReports: SelfReport[] = []

    const rawLogLines = await logsFilesApi.getRawLogLines(logFile)

    for (const rawLogLine of rawLogLines) {
      const log = convertRawLogLineToLog(rawLogLine)

      if (log === undefined) {
        selfReports.push({
          date: new Date(),
          message: rawLogLine.content,
          level: 'warning',
          reportedFile: logFile.fileName,
          reportedLine: rawLogLine.index + 1
        })
      } else {
        logs.push(log)
      }
    }

    return { logs, selfReports }
  }

  return {
    getAllLogs: async (): Promise<FoundLogs> => {
      const logFiles = await logsFilesApi.getAllLogFiles()
      const parsedLogFiles = await Promise.all(logFiles.map(parseLogFile))

      return {
        logs: parsedLogFiles.flatMap(({ logs }) => logs),
        selfReports: parsedLogFiles.flatMap(({ selfReports }) => selfReports)
      }
    },

    getLogs: (location): Promise<FoundLogs> => parseLogFile(logsFilesApi.getLogFile(location)),

    saveLogs: async (logs): Promise<void> => {
      const logsByLocation = new Map<string, Log[]>()

      for (const log of logs) {
        logsByLocation.set(log.location, [...(logsByLocation.get(log.location) ?? []), log])
      }

      await Promise.all(
        [...logsByLocation].map(([location, locationLogs]) => {
          const logFile = logsFilesApi.getLogFile(location)

          return logsFilesApi.saveRawLogLines(
            logFile,
            locationLogs
              .sort(
                (firstLog, secondLog) =>
                  new Date(firstLog.date).getTime() - new Date(secondLog.date).getTime()
              )
              .map((log, index) => ({
                logFile,
                index,
                content: JSON.stringify(convertLogToRawJsonLogLine(log))
              }))
          )
        })
      )
    },

    deleteLogs: (location): Promise<void> =>
      logsFilesApi.saveRawLogLines(logsFilesApi.getLogFile(location), [])
  }
}

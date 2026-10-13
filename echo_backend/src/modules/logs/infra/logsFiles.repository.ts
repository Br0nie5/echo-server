import type { Log } from '@echo/utilities'

import type { SelfReport } from '../../selfReport/domain/selfReport.js'
import type { SelfReportRepository } from '../../selfReport/domain/selfReport.repository.js'
import type { LogsRepository } from '../domain/logs.repository.js'

import type { LogFileDto } from './dto/logFile.dto.js'
import { convertRawLogLineToLog } from './dto/rawLogLine.dto.js'
import type { LogsFilesApi } from './logsFiles.api.js'

/**
 * Builds the `LogsRepository` that reads its logs from the files given by `logsFilesApi`.
 *
 * The location of a log is the path of its log file, and the locations it watches are the log
 * files of the logs directory. Each log is one line of its file, which holds neither its `id`, its
 * `locationName` nor its `groupName`: they come from the position of the line and from the path of
 * the file.
 *
 * The lines that hold no valid log are left out of the logs. Each time the logs are read, they are
 * saved to `parseLogsSelfReportRepository` as warning self reports, all in a single save, before
 * the logs are given: the message is the line itself, and the `origin` the path of its file
 * followed by its position among the non-blank lines of that file, starting at 1
 * (`/watched_logs/export_orders.jsonl:3`). Each is dated from when its line was found to hold no
 * log. Without a `parseLogsSelfReportRepository`, that is when the self reports are disabled, these
 * lines are only left out.
 *
 * ```ts
 * const logsRepository = createLogsFilesRepository(
 *   createLogsFilesApi(config.logs, filesService),
 *   parseLogsSelfReportRepository
 * )
 * ```
 */
export const createLogsFilesRepository = (
  logsFilesApi: LogsFilesApi,
  parseLogsSelfReportRepository: SelfReportRepository | undefined
): LogsRepository => {
  const parseLogFile = async (
    logFile: LogFileDto
  ): Promise<{ logs: Log[]; selfReports: SelfReport[] }> => {
    const logs: Log[] = []
    const selfReports: SelfReport[] = []

    const rawLogLines = await logsFilesApi.getRawLogLines(logFile)

    for (const rawLogLine of rawLogLines) {
      const log = convertRawLogLineToLog(rawLogLine)

      if (log === undefined) {
        selfReports.push({
          date: new Date(),
          message: rawLogLine.content,
          level: 'WARNING',
          origin: `${logFile.path}:${rawLogLine.index + 1}`
        })
      } else {
        logs.push(log)
      }
    }

    return { logs, selfReports }
  }

  return {
    getAllLogs: async (): Promise<Log[]> => {
      const logFiles = await logsFilesApi.getAllLogFiles()
      const parsedLogFiles = await Promise.all(logFiles.map(parseLogFile))

      await parseLogsSelfReportRepository?.saveSelfReports(
        parsedLogFiles.flatMap(({ selfReports }) => selfReports)
      )

      return parsedLogFiles.flatMap(({ logs }) => logs)
    }
  }
}

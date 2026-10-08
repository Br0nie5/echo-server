import path from 'path'

import type { FastifyBaseLogger } from 'fastify'

import type { SelfReportsConfig } from '../../../shared/config/backConfig.js'
import type { LogsFilesApi } from '../../logs/infra/logsFiles.api.js'
import type { SelfReport } from '../domain/selfReport.js'
import type { SelfReportRepository } from '../domain/selfReport.repository.js'

import type { SessionJobIdApi } from './fileSessionJobId.api.js'
import { createNoopSelfReportRepository } from './noopSelfReport.repository.js'
import { convertSelfReportToRawJsonLogLine } from './utils/convertSelfReportToRawJsonLogLine.js'

/** What {@link createSelfFileReportRepository} needs. */
export interface CreateSelfFileReportRepositoryOptions {
  logsFilesApi: LogsFilesApi
  sessionJobIdApi: SessionJobIdApi
  selfReportsConfig: SelfReportsConfig
  /** Name of the file the self reports are stored in, with its extension, such as `parseLogFile.jsonl`. */
  selfReportFileName: string
  logger: FastifyBaseLogger
}

/**
 * Builds the `SelfReportRepository` that stores its self reports in the file named
 * `selfReportFileName` of the self-reports directory of `selfReportsConfig`, through `logsFilesApi`.
 *
 * Each part of the backend that reports diagnostics gets its own repository, with its own file:
 *
 * ```ts
 * const selfReportRepository = await createSelfFileReportRepository({
 *   logsFilesApi: createLogsFilesApi(config.logs),
 *   sessionJobIdApi: createFileSessionJobIdApi(config.selfReports),
 *   selfReportsConfig: config.selfReports,
 *   selfReportFileName: config.selfReports.parseLogFileSelfReportFileName,
 *   logger: server.log
 * })
 * ```
 *
 * Building it takes its session jobId: the last one `sessionJobIdApi` gives plus one, or `1`
 * when it gives none (its file is missing, unreadable or holds none). It then creates the
 * self-reports directory and removes from the file the self reports older than the `retentionDays`
 * of `selfReportsConfig`. The session jobId is saved last, once the file is ready to be written,
 * so the next repository gets another one, even after a restart of the server. When one of these
 * fails, the error goes to `logger` and the repository returned stores nothing: an optional
 * feature that is misconfigured never blocks the start of the server.
 *
 * Every self report is written at the end of the file, with that jobId, the same for the whole life
 * of the repository. The lines of the self reports already in the file that are saved again are
 * deleted first. A failure to save goes to `logger` too.
 */
export const createSelfFileReportRepository = async ({
  logsFilesApi,
  sessionJobIdApi,
  selfReportsConfig,
  selfReportFileName,
  logger
}: CreateSelfFileReportRepositoryOptions): Promise<SelfReportRepository> => {
  const { selfReportsDirPath, retentionDays } = selfReportsConfig
  const selfReportFilePath = path.join(selfReportsDirPath, selfReportFileName)
  let sessionJobId: number

  try {
    const lastSessionJobId = await sessionJobIdApi.getLastSessionJobId().catch(() => 0)
    sessionJobId = lastSessionJobId + 1

    await logsFilesApi.createDirectory(selfReportsDirPath)
    await logsFilesApi.rotateLogFile(selfReportFilePath, retentionDays)
    await sessionJobIdApi.saveLastSessionJobId(sessionJobId)
  } catch (error) {
    logger.error(
      { err: error, selfReportFileName },
      'Failed to set up self reports, disabling them for this session'
    )

    return createNoopSelfReportRepository()
  }

  return {
    saveSelfReports: async (selfReports: SelfReport[]): Promise<void> => {
      if (selfReports.length === 0) {
        return
      }

      try {
        await logsFilesApi.deleteLogFileSelectedLines(selfReportFilePath, (rawJsonLogLine) =>
          selfReports.some(
            ({ reportedFile, reportedLine, message }) =>
              reportedFile === rawJsonLogLine.call_file &&
              reportedLine === rawJsonLogLine.call_line &&
              message === rawJsonLogLine.message
          )
        )

        await logsFilesApi.appendLogFileLines(
          selfReportFilePath,
          selfReports.map((selfReport) =>
            convertSelfReportToRawJsonLogLine(selfReport, sessionJobId)
          )
        )
      } catch (error) {
        logger.error({ err: error, selfReportFileName }, 'Failed to write self reports')
      }
    }
  }
}

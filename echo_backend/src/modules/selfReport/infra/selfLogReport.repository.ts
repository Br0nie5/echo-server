import type { Log } from '@echo/utilities'

import type { SelfReportsConfig } from '../../../shared/config/backConfig.js'
import type { Logger } from '../../../shared/types/logger.js'
import type { LogsRepository } from '../../logs/domain/logs.repository.js'
import type { SelfReport } from '../domain/selfReport.js'
import type { SelfReportRepository } from '../domain/selfReport.repository.js'

import type { SessionJobIdApi } from './fileSessionJobId.api.js'
import { createNoopSelfReportRepository } from './noopSelfReport.repository.js'
import { convertSelfReportToLog } from './utils/convertSelfReportToLog.js'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/** What {@link createSelfLogReportRepository} needs. */
export interface CreateSelfLogReportRepositoryOptions {
  logsRepository: LogsRepository
  sessionJobIdApi: SessionJobIdApi
  selfReportsConfig: SelfReportsConfig
  /** Location of `logsRepository` the self reports are stored at. */
  selfReportsLocation: string
  /** Short name of `selfReportsLocation`, the one the app shows the self reports under. */
  selfReportsLocationName: string
  logger: Logger
}

/**
 * Builds the `SelfReportRepository` that stores its self reports as logs of `logsRepository`, at
 * `selfReportsLocation`.
 *
 * Each part of the backend that reports diagnostics gets its own repository, with its own
 * location:
 *
 * ```ts
 * const selfReportRepository = await createSelfLogReportRepository({
 *   logsRepository,
 *   sessionJobIdApi: createFileSessionJobIdApi(selfReportsConfig, filesService),
 *   selfReportsConfig,
 *   selfReportsLocation: '/server_logs/self_reports/Echo/log/parseLogFile.jsonl',
 *   selfReportsLocationName: 'parseLogFile',
 *   logger: server.log
 * })
 * ```
 *
 * A self report is converted to a log (see `convertSelfReportToLog`) of `selfReportsLocation`,
 * named `selfReportsLocationName`, in the `selfReportsGroupName` group of `selfReportsConfig`. When
 * the location is one the logs are read from, it shows up in the app like any other log.
 *
 * Storing always goes the same way: the logs stored at the location are read, some of them are
 * filtered out, the new ones are added after those that remain, and the whole is stored again.
 * When nothing remains, the logs of the location are deleted. What is stored at the location that
 * is not a valid log is not read, so it is gone once the location is stored again.
 *
 * Building the repository takes its session jobId: the last one `sessionJobIdApi` gives plus one,
 * or `1` when it gives none (its file is missing, unreadable or holds none). It then stores the
 * location with the logs older than the `retentionDays` of `selfReportsConfig` filtered out, which
 * also tells whether the location can be written. The session jobId is saved last, once the
 * location is ready, so the next repository gets another one, even after a restart of the server.
 * When one of these fails, the error goes to `logger` and the repository returned stores nothing:
 * an optional feature that is misconfigured never blocks the start of the server.
 *
 * Saving self reports stores them with that jobId, the same for the whole life of the repository.
 * The stored logs with the `callFile`, `callLine` and `message` of one of them are filtered out:
 * a self report saved again replaces the one stored before, so each is stored once, with its
 * latest date. A failure to save goes to `logger` too, and is not thrown.
 */
export const createSelfLogReportRepository = async ({
  logsRepository,
  sessionJobIdApi,
  selfReportsConfig: { retentionDays, selfReportsGroupName },
  selfReportsLocation,
  selfReportsLocationName,
  logger
}: CreateSelfLogReportRepositoryOptions): Promise<SelfReportRepository> => {
  let sessionJobId: number

  const storeFilteredLogs = async (
    shouldFilterLogOut: (storedLog: Log) => boolean,
    newLogs: Log[] = []
  ): Promise<void> => {
    const { logs: storedLogs } = await logsRepository.getLogs(selfReportsLocation)
    const logs = [...storedLogs.filter((storedLog) => !shouldFilterLogOut(storedLog)), ...newLogs]

    if (logs.length > 0) {
      await logsRepository.saveLogs(logs)
    } else {
      await logsRepository.deleteLogs(selfReportsLocation)
    }
  }

  try {
    const lastSessionJobId = await sessionJobIdApi.getLastSessionJobId().catch(() => 0)
    sessionJobId = lastSessionJobId + 1

    const retentionTime = Date.now() - retentionDays * MILLISECONDS_PER_DAY
    await storeFilteredLogs(({ date }) => new Date(date).getTime() < retentionTime)

    await sessionJobIdApi.saveLastSessionJobId(sessionJobId)
  } catch (error) {
    logger.error(
      { err: error, selfReportsLocation },
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
        const newLogs = selfReports.map((selfReport) =>
          convertSelfReportToLog(selfReport, {
            jobId: sessionJobId,
            location: selfReportsLocation,
            locationName: selfReportsLocationName,
            groupName: selfReportsGroupName
          })
        )

        await storeFilteredLogs(
          (storedLog) =>
            newLogs.some(
              ({ callFile, callLine, message }) =>
                callFile === storedLog.callFile &&
                callLine === storedLog.callLine &&
                message === storedLog.message
            ),
          newLogs
        )
      } catch (error) {
        logger.error({ err: error, selfReportsLocation }, 'Failed to write self reports')
      }
    }
  }
}

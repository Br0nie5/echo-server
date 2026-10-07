import type { FastifyBaseLogger } from 'fastify'

import type { SelfLog } from '../domain/selfLog.js'
import type { SelfLogRepository } from '../domain/selfLog.repository.js'

import { createNoopSelfLogRepository } from './noopSelfLog.repository.js'
import type { SelfFileLogApi } from './selfFileLog.api.js'
import { convertSelfLogToRawJsonLogLine } from './utils/convertSelfLogToRawJsonLogLine.js'
import { deleteStoredSelfLogsDuplicate } from './utils/deleteStoredSelfLogsDuplicate.js'
import { getNextSessionJobId } from './utils/getNextSessionJobId.js'
import { pruneOldSelfLogFileLines } from './utils/pruneOldSelfLogFileLines.js'

/** What {@link createSelfFileLogRepository} needs. */
export interface CreateSelfFileLogRepositoryOptions {
  selfFileLogApi: SelfFileLogApi
  /** Name of the file the self logs are stored in, with its extension, such as `parseLogFile.jsonl`. */
  selfLogFileName: string
  /** Number of days a stored self log is kept. */
  retentionDays: number
  logger: FastifyBaseLogger
}

/**
 * Builds the `SelfLogRepository` that stores its self logs in the file named `selfLogFileName`,
 * through `selfFileLogApi`.
 *
 * Each part of the backend that reports diagnostics gets its own repository, with its own file:
 *
 * ```ts
 * const selfLogRepository = await createSelfFileLogRepository({
 *   selfFileLogApi: createSelfFileLogApi(env.LOGS_DIR_PATH, env.SERVER_NAME),
 *   selfLogFileName: 'parseLogFile.jsonl',
 *   retentionDays: env.SELF_LOGS_RETENTION_DAYS,
 *   logger: server.log
 * })
 * ```
 *
 * Building it takes the next session jobId (see {@link getNextSessionJobId}), creates the self-logs
 * directory and removes from the file the self logs older than `retentionDays`. When one of these
 * fails, the error goes to `logger` and the repository returned stores nothing: an optional feature
 * that is misconfigured never blocks the start of the server.
 *
 * Every self log is written with that jobId, the same for the whole life of the repository, and
 * the date it is saved at, at the end of the file. The lines of the self logs already in the file
 * that are saved again are deleted first. A failure to save goes to `logger` too.
 */
export const createSelfFileLogRepository = async ({
  selfFileLogApi,
  selfLogFileName,
  retentionDays,
  logger
}: CreateSelfFileLogRepositoryOptions): Promise<SelfLogRepository> => {
  let sessionJobId: number

  try {
    sessionJobId = await getNextSessionJobId()

    await selfFileLogApi.createSelfLogsDirectory()
    await pruneOldSelfLogFileLines(selfFileLogApi, selfLogFileName, retentionDays)
  } catch (error) {
    logger.error(
      { err: error, selfLogFileName },
      'Failed to set up self logs, disabling them for this session'
    )

    return createNoopSelfLogRepository()
  }

  return {
    saveSelfLogs: async (selfLogs: SelfLog[]): Promise<void> => {
      if (selfLogs.length === 0) {
        return Promise.resolve()
      }

      try {
        await deleteStoredSelfLogsDuplicate(selfFileLogApi, selfLogFileName, selfLogs)

        const date = new Date()

        await selfFileLogApi.appendRawSelfLogLines(
          selfLogFileName,
          selfLogs.map((selfLog) =>
            JSON.stringify(convertSelfLogToRawJsonLogLine(selfLog, sessionJobId, date))
          )
        )
      } catch (error) {
        logger.error({ err: error, selfLogFileName }, 'Failed to write self logs')
      }
    }
  }
}

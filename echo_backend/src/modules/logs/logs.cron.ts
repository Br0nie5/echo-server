import type { Log, LogCategory } from '@echo/utilities'
import type { FastifyPluginAsync, FastifyPluginOptions } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import cron from 'node-cron'

import type { LogsCronOptions } from '../../shared/types/echoBackEnv.js'

import type { CheckpointStore } from './logs.checkpoint.js'
import type { LogsService } from './logs.service.js'
import type { LogsNotifier } from './notifications/logs.notifier.js'

/** The only part of `LogsService` the cron depends on. */
type ProblemLogsSource = Pick<LogsService, 'getAllLastLogs'>

/** Logs in one of the watched categories logged since `watchSinceDate`. */
export async function getProblemLogs(
  logsService: ProblemLogsSource,
  watchSinceDate: Date,
  watchedLogsCategories: LogCategory[]
): Promise<Log[]> {
  return logsService.getAllLastLogs({
    fromDate: watchSinceDate,
    categories: watchedLogsCategories,
    searchFilters: []
  })
}

/** Everything one run of the problem logs check needs. */
export interface ProblemLogsCheck {
  watchedLogsCategories: LogCategory[]
  logsService: ProblemLogsSource
  notifier: LogsNotifier
  checkpointStore: CheckpointStore
}

/**
 * One run of the cron: notifies the problem logs logged since the previous run, then moves the checkpoint.
 * The very first run only sets the checkpoint, so the logs that predate the cron are not notified.
 * The checkpoint is not moved if notifying throws, so the same logs are retried on the next run.
 */
export async function checkProblemLogsAndNotify({
  watchedLogsCategories,
  logsService,
  notifier,
  checkpointStore
}: ProblemLogsCheck): Promise<void> {
  const lastCheckDate = await checkpointStore.getLastCheckDate()

  const now = new Date()

  if (lastCheckDate === undefined) {
    await checkpointStore.saveLastCheckDate(now)
    return
  }

  const problemLogs = await getProblemLogs(logsService, lastCheckDate, watchedLogsCategories)

  if (problemLogs.length > 0) {
    await notifier.notify(problemLogs)
  }

  await checkpointStore.saveLastCheckDate(now)
}

/** Options of the `logsCron` plugin. */
export interface LogsCronPluginOptions extends FastifyPluginOptions {
  logsCronOptions: LogsCronOptions
  logsService: ProblemLogsSource
  notifier: LogsNotifier
  checkpointStore: CheckpointStore
}

/** Schedules `checkProblemLogsAndNotify` and stops the task when the server closes. A failing run is logged, not thrown, so it does not stop the schedule. */
const logsCron: FastifyPluginAsync<LogsCronPluginOptions> = async (
  fastify,
  { logsCronOptions, logsService, notifier, checkpointStore }
) => {
  fastify.log.info('Registering logs cron')

  const task = cron.schedule(logsCronOptions.LOGS_CRON_SCHEDULE_REGEX, async () => {
    try {
      await checkProblemLogsAndNotify({
        watchedLogsCategories: logsCronOptions.WATCHED_LOGS_CATEGORIES,
        logsService,
        notifier,
        checkpointStore
      })
    } catch (err) {
      fastify.log.error({ err }, 'Cron job failed')
    }
  })

  fastify.addHook('onClose', async () => {
    await task.stop()
  })
}

export default fastifyPlugin(logsCron)

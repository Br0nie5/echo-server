import type { FastifyPluginAsync, FastifyPluginOptions } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import cron from 'node-cron'

import type { LogsNotifierConfig } from '../../../../../shared/config/logsNotifierConfig.js'
import type { NotificationsService } from '../../../../notifications/domain/notifications.service.js'
import { checkWatchedLogsAndNotify } from '../application/checkWatchedLogsAndNotify.js'
import type { UnNotifiedLogsRepository } from '../domain/unNotifiedLogs.repository.js'

/** Options of the `logsNotifier` plugin. */
export interface LogsNotifierPluginOptions extends FastifyPluginOptions {
  logsNotifierConfig: LogsNotifierConfig
  unNotifiedLogsRepository: UnNotifiedLogsRepository
  notificationsService: NotificationsService
}

const scheduleLogsNotifier: FastifyPluginAsync<LogsNotifierPluginOptions> = async (
  fastify,
  { logsNotifierConfig, unNotifiedLogsRepository, notificationsService }
) => {
  fastify.log.info('Registering logs notifier')

  let runningCheck: Promise<void> | undefined

  const check = async (): Promise<void> => {
    try {
      await checkWatchedLogsAndNotify({
        logsNotifierConfig,
        unNotifiedLogsRepository,
        notificationsService
      })
    } catch (error) {
      fastify.log.error({ err: error }, 'Cron job failed')
    }
  }

  const task = cron.schedule(
    logsNotifierConfig.schedule,
    async () => {
      runningCheck = check()
      await runningCheck
    },
    { noOverlap: true, timezone: logsNotifierConfig.timezone }
  )

  fastify.addHook('onClose', async () => {
    await task.stop()
    // Stopping the schedule does not stop a check going on: cut once the logs are notified, it
    // would not mark them as notified, and the next start would notify them again.
    await runningCheck
  })
}

/**
 * Fastify plugin running `checkWatchedLogsAndNotify` on the `schedule` of `logsNotifierConfig`,
 * read in its `timezone`, and stopping when the server closes, the server waiting for the check
 * going on, if any, to end.
 *
 * A failing run is logged, not thrown, so it does not stop the schedule. A run that is due while
 * the previous one is still going is skipped: two runs at once would read the same unnotified logs
 * and notify them twice, while the next run notifies what the skipped one would have.
 *
 * ```ts
 * await server.register(logsNotifier, { logsNotifierConfig, unNotifiedLogsRepository, ... })
 * ```
 */
export const logsNotifier = fastifyPlugin(scheduleLogsNotifier)

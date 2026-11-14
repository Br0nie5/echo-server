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
      fastify.log.error({ err: error }, 'The watched logs could not be checked')
    }
  }

  const startCheck = (): Promise<void> => {
    runningCheck ??= check().finally(() => {
      runningCheck = undefined
    })
    return runningCheck
  }

  const task = cron.schedule(logsNotifierConfig.schedule, startCheck, {
    timezone: logsNotifierConfig.timezone
  })

  fastify.addHook('onReady', async () => {
    void startCheck()
  })

  fastify.addHook('onClose', async () => {
    await task.stop()
    // Stopping the schedule does not stop a check going on: cut once the logs are notified, it
    // would not mark them as notified, and the next start would notify them again.
    await runningCheck
  })
}

/**
 * Fastify plugin running `checkWatchedLogsAndNotify` once the server is ready, then on the
 * `schedule` of `logsNotifierConfig`, read in its `timezone`, and stopping when the server closes,
 * the server waiting for the check going on, if any, to end.
 *
 * The server does not wait for the first check to be ready. A failing check is logged, not thrown,
 * so it stops neither the server nor the schedule. A check that is due while another one is still
 * going is skipped: two checks at once would read the same unnotified logs and notify them twice,
 * while the next check notifies what the skipped one would have.
 *
 * ```ts
 * await server.register(logsNotifier, { logsNotifierConfig, unNotifiedLogsRepository, ... })
 * ```
 */
export const logsNotifier = fastifyPlugin(scheduleLogsNotifier)

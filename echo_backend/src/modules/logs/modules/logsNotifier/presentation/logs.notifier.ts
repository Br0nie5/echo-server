import type { FastifyPluginAsync, FastifyPluginOptions } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import cron from 'node-cron'

import type { LogsNotifierConfig } from '../../../../../shared/config/logsNotifierConfig.js'
import type { NotificationsService } from '../../../../notifications/domain/notifications.service.js'
import type { SelfReportRepository } from '../../../../selfReports/domain/selfReport.repository.js'
import { checkWatchedLogsAndNotify } from '../application/checkWatchedLogsAndNotify.js'
import type { UnNotifiedLogsRepository } from '../domain/unNotifiedLogs.repository.js'

/** Options of the `logsNotifier` plugin. */
export interface LogsNotifierPluginOptions extends FastifyPluginOptions {
  logsNotifierConfig: LogsNotifierConfig
  unNotifiedLogsRepository: UnNotifiedLogsRepository
  notificationsService: NotificationsService
  /**
   * Where a check reports the watched logs it could not notify. Missing when the self reports are
   * disabled.
   */
  logsNotifierSelfReportRepository?: SelfReportRepository
}

const scheduleLogsNotifier: FastifyPluginAsync<LogsNotifierPluginOptions> = async (
  fastify,
  {
    logsNotifierConfig,
    unNotifiedLogsRepository,
    notificationsService,
    logsNotifierSelfReportRepository
  }
) => {
  fastify.log.info('Registering logs notifier')

  const task = cron.schedule(
    logsNotifierConfig.schedule,
    async () => {
      try {
        await checkWatchedLogsAndNotify({
          logsNotifierConfig,
          unNotifiedLogsRepository,
          notificationsService,
          logsNotifierSelfReportRepository
        })
      } catch (error) {
        fastify.log.error({ err: error }, 'Cron job failed')
      }
    },
    { noOverlap: true }
  )

  fastify.addHook('onClose', async () => {
    await task.stop()
  })
}

/**
 * Fastify plugin running `checkWatchedLogsAndNotify` on the `schedule` of `logsNotifierConfig`, and
 * stopping when the server closes.
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

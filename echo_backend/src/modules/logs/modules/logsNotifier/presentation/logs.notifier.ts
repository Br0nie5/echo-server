import type { FastifyPluginAsync, FastifyPluginOptions } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import cron from 'node-cron'

import type { LogsNotifierConfig } from '../../../../../shared/config/backConfig.js'
import type { NotifierService } from '../../../../../shared/services/notifier.service.js'
import type { SelfReportRepository } from '../../../../selfReport/domain/selfReport.repository.js'
import type { LogsRepository } from '../../../domain/logs.repository.js'
import { checkProblemLogsAndNotify } from '../application/checkProblemLogsAndNotify.js'
import type { CheckDateRepository } from '../domain/checkDate.repository.js'

/** Options of the `logsNotifier` plugin. */
export interface LogsNotifierPluginOptions extends FastifyPluginOptions {
  logsNotifierConfig: LogsNotifierConfig
  logsRepository: LogsRepository
  notifierService: NotifierService
  checkDateRepository: CheckDateRepository
  /**
   * Where a check reports the problem logs it could not notify. Missing when the self reports are
   * disabled.
   */
  logsNotifierSelfReportRepository?: SelfReportRepository
}

const scheduleLogsNotifier: FastifyPluginAsync<LogsNotifierPluginOptions> = async (
  fastify,
  {
    logsNotifierConfig,
    logsRepository,
    notifierService,
    checkDateRepository,
    logsNotifierSelfReportRepository
  }
) => {
  fastify.log.info('Registering logs notifier')

  const task = cron.schedule(
    logsNotifierConfig.schedule,
    async () => {
      try {
        await checkProblemLogsAndNotify({
          watchedLogsLevels: logsNotifierConfig.watchedLogsLevels,
          serverName: logsNotifierConfig.serverName,
          timezone: logsNotifierConfig.notifierTimezone,
          logsRepository,
          notifierService,
          checkDateRepository,
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
 * Fastify plugin running `checkProblemLogsAndNotify` on the `schedule` of `logsNotifierConfig`, and
 * stopping when the server closes.
 *
 * A failing run is logged, not thrown, so it does not stop the schedule. A run that is due while
 * the previous one is still going is skipped: two runs at once would read the same last check date
 * and notify the same logs twice, while the next run notifies what the skipped one would have.
 *
 * ```ts
 * await server.register(logsNotifier, { logsNotifierConfig, logsRepository, ... })
 * ```
 */
export const logsNotifier = fastifyPlugin(scheduleLogsNotifier)

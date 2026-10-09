import type { FastifyPluginAsync, FastifyPluginOptions } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import cron from 'node-cron'

import type { LogsNotifierConfig } from '../../../../../shared/config/backConfig.js'
import type { Notifier } from '../../../../notification/domain/notifier.js'
import type { SelfReportRepository } from '../../../../selfReport/domain/selfReport.repository.js'
import type { LogsRepository } from '../../../domain/logs.repository.js'
import { checkProblemLogsAndNotify } from '../application/checkProblemLogsAndNotify.js'
import type { CheckDateRepository } from '../domain/checkDate.repository.js'

/** Options of the `logsNotifier` plugin. */
export interface LogsNotifierPluginOptions extends FastifyPluginOptions {
  logsNotifierConfig: LogsNotifierConfig
  logsRepository: LogsRepository
  /** Where the stored entries that hold no valid log are reported. */
  logsSelfReportRepository: SelfReportRepository
  notifier: Notifier
  checkDateRepository: CheckDateRepository
  selfReportRepository: SelfReportRepository
}

/**
 * Runs `checkProblemLogsAndNotify` on the `schedule` of `logsNotifierConfig`, and stops when the server
 * closes.
 *
 * A failing run is logged, not thrown, so it does not stop the schedule.
 */
const logsNotifier: FastifyPluginAsync<LogsNotifierPluginOptions> = async (
  fastify,
  {
    logsNotifierConfig,
    logsRepository,
    logsSelfReportRepository,
    notifier,
    checkDateRepository,
    selfReportRepository
  }
) => {
  fastify.log.info('Registering logs notifier')

  const task = cron.schedule(logsNotifierConfig.schedule, async () => {
    try {
      await checkProblemLogsAndNotify({
        watchedLogsCategories: logsNotifierConfig.watchedLogsCategories,
        serverName: logsNotifierConfig.serverName,
        timezone: logsNotifierConfig.notifierTimezone,
        logsRepository,
        logsSelfReportRepository,
        notifier,
        checkDateRepository,
        selfReportRepository
      })
    } catch (error) {
      fastify.log.error({ err: error }, 'Cron job failed')
    }
  })

  fastify.addHook('onClose', async () => {
    await task.stop()
  })
}

export default fastifyPlugin(logsNotifier)

import { rejectUnauthenticatedRequest } from '../modules/auth/presentation/auth.hooks.js'
import type { LogsRepository } from '../modules/logs/domain/logs.repository.js'
import { createLogsController } from '../modules/logs/presentation/logs.controller.js'
import { logsRoutes } from '../modules/logs/presentation/logs.routes.js'
import type { SelfReportRepository } from '../modules/selfReport/domain/selfReport.repository.js'
import type { BackConfig } from '../shared/config/backConfig.js'

import type { EchoServer } from './types/echoServer.js'

/**
 * Registers the routes of the logs under `apiRoutePrefix`, protected by a login when
 * authentication is enabled.
 *
 * They read the logs from `logsRepository`. When they are given a `logsSelfReportRepository`, that
 * is when the self reports are enabled, they report the stored entries that hold no valid log to
 * it, and answer its self reports among the logs.
 */
export const registerLogsRoutes = async (
  server: EchoServer,
  { auth, server: { apiRoutePrefix } }: BackConfig,
  logsRepository: LogsRepository,
  logsSelfReportRepository: SelfReportRepository | undefined
): Promise<void> => {
  await server.register(logsRoutes, {
    prefix: apiRoutePrefix,
    controller: createLogsController(logsRepository, logsSelfReportRepository),
    authenticate: auth ? rejectUnauthenticatedRequest : undefined
  })
}

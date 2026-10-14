import { rejectUnauthenticatedRequest } from '../modules/auth/presentation/auth.hooks.js'
import type { LogsRepository } from '../modules/logs/domain/logs.repository.js'
import { createLogsController } from '../modules/logs/presentation/logs.controller.js'
import { logsRoutes } from '../modules/logs/presentation/logs.routes.js'

import type { Settings } from './settings/settings.js'
import type { EchoServer } from './types/echoServer.js'

/**
 * Registers the routes of the logs under `apiRoutePrefix`, protected by a login when
 * authentication is enabled.
 *
 * They read the logs from `logsRepository`.
 */
export const registerLogsRoutes = async (
  server: EchoServer,
  { auth, server: { apiRoutePrefix } }: Settings,
  logsRepository: LogsRepository
): Promise<void> => {
  await server.register(logsRoutes, {
    prefix: apiRoutePrefix,
    controller: createLogsController(logsRepository),
    authenticate: auth ? rejectUnauthenticatedRequest : undefined
  })
}

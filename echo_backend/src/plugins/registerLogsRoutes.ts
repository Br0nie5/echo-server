import { authPreHandler } from '../modules/auth/presentation/auth.hooks.js'
import type { LogsRepository } from '../modules/logs/domain/logs.repository.js'
import { createLogsController } from '../modules/logs/presentation/logs.controller.js'
import { logsRoutes } from '../modules/logs/presentation/logs.routes.js'
import type { BackConfig } from '../shared/config/backConfig.js'

import type { EchoServer } from './types/echoServer.js'

/** Registers the routes of the logs under `apiRoutePrefix`, reading them from `logsRepository`, protected by a login when authentication is enabled. */
export const registerLogsRoutes = async (
  server: EchoServer,
  { auth: { hasAuthentication }, server: { apiRoutePrefix } }: BackConfig,
  logsRepository: LogsRepository
): Promise<void> => {
  await server.register(logsRoutes, {
    prefix: apiRoutePrefix,
    controller: createLogsController(logsRepository),
    preHandler: hasAuthentication ? authPreHandler : undefined
  })
}

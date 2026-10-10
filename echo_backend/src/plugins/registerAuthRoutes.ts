import { createAuthUsersDbRepository } from '../modules/auth/infra/authUsersDb.repository.js'
import { createUsersDb } from '../modules/auth/infra/users.db.js'
import { createAuthController } from '../modules/auth/presentation/auth.controller.js'
import { authRoutes } from '../modules/auth/presentation/auth.routes.js'
import type { BackConfig } from '../shared/config/backConfig.js'

import type { EchoServer } from './types/echoServer.js'

/** Registers the routes of the authentication under `apiRoutePrefix`, on top of the users database, only when authentication is enabled. */
export const registerAuthRoutes = async (
  server: EchoServer,
  { auth: authConfig, server: { apiRoutePrefix } }: BackConfig
): Promise<void> => {
  if (!authConfig) {
    server.log.info('Authentication is disabled, skipping its registration')
    return
  }

  const authRepository = createAuthUsersDbRepository(await createUsersDb(authConfig))
  await server.register(authRoutes, {
    prefix: apiRoutePrefix,
    controller: createAuthController(authRepository, authConfig)
  })
}

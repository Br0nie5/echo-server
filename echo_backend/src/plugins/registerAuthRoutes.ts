import { createAuthUsersDbRepository } from '../modules/auth/infra/authUsersDb.repository.js'
import { createUsersDb } from '../modules/auth/infra/users.db.js'
import { createAuthController } from '../modules/auth/presentation/auth.controller.js'
import { authRoutes } from '../modules/auth/presentation/auth.routes.js'
import type { BackConfig } from '../shared/config/backConfig.js'
import type { FilesService } from '../shared/services/files.service.js'

import type { EchoServer } from './types/echoServer.js'

/**
 * Registers the routes of the authentication under `apiRoutePrefix`, on top of the users
 * database, only when authentication is enabled.
 *
 * The file of the database is prepared through `filesService`.
 */
export const registerAuthRoutes = async (
  server: EchoServer,
  { auth: authConfig, server: { apiRoutePrefix } }: BackConfig,
  filesService: FilesService
): Promise<void> => {
  if (!authConfig) {
    server.log.info('Authentication is disabled, skipping its registration')
    return
  }

  const authRepository = createAuthUsersDbRepository(await createUsersDb(authConfig, filesService))
  await server.register(authRoutes, {
    prefix: apiRoutePrefix,
    controller: createAuthController(authRepository, authConfig)
  })
}

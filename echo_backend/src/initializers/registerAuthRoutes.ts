import rateLimit from '@fastify/rate-limit'

import { createAuthUsersDbRepository } from '../modules/auth/infra/authUsersDb.repository.js'
import { createUsersDb } from '../modules/auth/infra/users.db.js'
import { createAuthController } from '../modules/auth/presentation/auth.controller.js'
import { authRoutes } from '../modules/auth/presentation/auth.routes.js'
import type { FilesService } from '../shared/services/files.service.js'

import type { Settings } from './settings/settings.js'
import type { EchoServer } from './types/echoServer.js'

/**
 * Registers the routes of the authentication under `apiRoutePrefix`, on top of the users
 * database, only when authentication is enabled.
 *
 * The users database is opened at the `usersDbFilePath` of the auth settings, its file prepared
 * through `filesService` and closed with the server, and the routes are only given the auth config. `@fastify/rate-limit` is
 * registered for the routes that ask for it only: those receiving credentials, limited to the
 * `credentialsAttemptsLimit` of the auth config. The attempts are counted per client address when
 * the `trustedProxies` of the server settings say which proxies to believe. When there are none,
 * whatever sends the request being trusted, a client could name any address in `X-Forwarded-For`
 * to never reach the limit, so they are counted per connecting address instead: the one of the
 * reverse proxy, shared by all its clients, when there is one.
 */
export const registerAuthRoutes = async (
  server: EchoServer,
  { auth: authSettings, server: { apiRoutePrefix, trustedProxies } }: Settings,
  filesService: FilesService
): Promise<void> => {
  if (!authSettings) {
    server.log.info('Authentication is disabled, skipping its registration')
    return
  }

  const { config: authConfig, usersDbFilePath } = authSettings

  const usersDb = await createUsersDb({ usersDbFilePath }, filesService)
  server.addHook('onClose', async () => {
    usersDb.close()
  })

  const authRepository = createAuthUsersDbRepository(usersDb)
  await server.register(rateLimit, {
    global: false,
    keyGenerator: (request) =>
      trustedProxies === undefined ? String(request.socket.remoteAddress) : request.ip
  })
  await server.register(authRoutes, {
    prefix: apiRoutePrefix,
    controller: createAuthController(authRepository, authConfig),
    authConfig
  })
}

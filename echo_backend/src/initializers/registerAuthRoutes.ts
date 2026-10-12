import rateLimit from '@fastify/rate-limit'

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
 * The file of the database is prepared through `filesService`. `@fastify/rate-limit` is registered
 * for the routes that ask for it only: those receiving credentials, limited to the
 * `credentialsAttemptsLimit` of the auth config. The attempts are counted per client address when
 * the `trustedProxies` of the server config say which proxies to believe. When it has none, whatever
 * sends the request being trusted, a client could name any address in `X-Forwarded-For` to never reach the
 * limit, so they are counted per connecting address instead: the one of the reverse proxy, shared
 * by all its clients, when there is one.
 */
export const registerAuthRoutes = async (
  server: EchoServer,
  { auth: authConfig, server: { apiRoutePrefix, trustedProxies } }: BackConfig,
  filesService: FilesService
): Promise<void> => {
  if (!authConfig) {
    server.log.info('Authentication is disabled, skipping its registration')
    return
  }

  const authRepository = createAuthUsersDbRepository(await createUsersDb(authConfig, filesService))
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

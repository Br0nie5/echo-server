import type { EchoError } from '@echo/utilities'
import fastifyStatic from '@fastify/static'

import type { ServerConfig } from '../shared/config/backConfig.js'

import type { EchoServer } from './types/echoServer.js'

/**
 * Serves the built frontend under `appRoutePrefix`.
 *
 * An unknown path under it gets `index.html` (SPA routing). Anything else gets a 404 `EchoError`,
 * a path that only starts like the prefix (`/application` for `/app`) included.
 */
export const registerFrontend = async (
  server: EchoServer,
  { frontendDistDirPath, appRoutePrefix }: ServerConfig
): Promise<void> => {
  await server.register(fastifyStatic, {
    root: frontendDistDirPath,
    prefix: appRoutePrefix
  })

  const isFrontendPath = (url: string): boolean => {
    const urlPath = url.split('?')[0]

    return urlPath === appRoutePrefix || urlPath.startsWith(`${appRoutePrefix}/`)
  }

  server.setNotFoundHandler((request, reply) => {
    if (isFrontendPath(request.url)) {
      return reply.sendFile('index.html', frontendDistDirPath)
    }

    const error: EchoError = { statusCode: 404, message: 'Not found.' }
    return reply.status(error.statusCode).send(error)
  })
}

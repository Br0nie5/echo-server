import fastifyStatic from '@fastify/static'

import type { ServerConfig } from '../shared/config/backConfig.js'

import type { EchoServer } from './types/echoServer.js'

/** Serves the built frontend under `appRoutePrefix`. Unknown paths under it get `index.html` (SPA routing), anything else a JSON 404. */
export const registerFrontend = async (
  server: EchoServer,
  { frontendDistDirPath, appRoutePrefix }: ServerConfig
): Promise<void> => {
  await server.register(fastifyStatic, {
    root: frontendDistDirPath,
    prefix: appRoutePrefix
  })

  server.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith(appRoutePrefix)) {
      return reply.sendFile('index.html', frontendDistDirPath)
    }
    return reply.code(404).send({ error: 'Not found' })
  })
}

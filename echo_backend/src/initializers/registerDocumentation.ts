import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'

import type { ServerConfig } from '../shared/config/backConfig.js'

import type { EchoServer } from './types/echoServer.js'

/**
 * Registers Swagger, which builds the OpenAPI document from the routes, and its UI, served under
 * `documentationRoutePrefix`.
 *
 * Both say where Echo is really reached, `basePath` included: the document gives the routes below
 * it, on the origin the document is loaded from, and the UI loads its files below it.
 */
export const registerDocumentation = async (
  server: EchoServer,
  serverConfig: ServerConfig
): Promise<void> => {
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'Echo API',
        description: 'Auto-generated API documentation for the Echo server',
        version: '1.0.0'
      },
      // Without `servers`, the routes are at the root of the origin the document is loaded from.
      ...(serverConfig.basePath && { servers: [{ url: serverConfig.basePath }] }),
      tags: [
        {
          name: 'Logs',
          description: 'Everything concerning getting scripts logs'
        },
        {
          name: 'Authentication',
          description: 'Everything concerning authentication if it is enabled'
        }
      ]
    },
    // The schemas keep the name they are registered with, which @fastify/swagger would otherwise
    // replace with `def-<index>`.
    refResolver: {
      buildLocalReference(json, _baseUri, _fragment, index) {
        return json.$id?.toString() || `def-${index}`
      }
    }
  })

  await server.register(swaggerUI, {
    routePrefix: serverConfig.documentationRoutePrefix,
    indexPrefix: serverConfig.basePath,
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  })
}

import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'

import type { ServerSettings } from './settings/settings.js'
import type { EchoServer } from './types/echoServer.js'
import { getSchemaReference } from './utils/getSchemaReference.js'

/**
 * Registers Swagger, which builds the OpenAPI document from the routes, and its UI, served under
 * `documentationRoutePrefix`, when `hasDocumentationRoute` of the settings is `true`. Registers
 * nothing otherwise: the server then has neither the document nor its UI.
 *
 * Both say where Echo is really reached, `basePath` included: the document gives the routes below
 * it, on the origin the document is loaded from, and the UI loads its files below it.
 */
export const registerDocumentation = async (
  server: EchoServer,
  serverSettings: ServerSettings
): Promise<void> => {
  if (!serverSettings.hasDocumentationRoute) {
    return
  }

  await server.register(swagger, {
    openapi: {
      info: {
        title: 'Echo API',
        description: 'Auto-generated API documentation for the Echo server',
        version: '1.0.0'
      },
      // Without `servers`, the routes are at the root of the origin the document is loaded from.
      ...(serverSettings.basePath && { servers: [{ url: serverSettings.basePath }] }),
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
    refResolver: {
      buildLocalReference: (json, _baseUri, _fragment, index) => getSchemaReference(json, index)
    }
  })

  await server.register(swaggerUI, {
    routePrefix: serverSettings.documentationRoutePrefix,
    indexPrefix: serverSettings.basePath,
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  })
}

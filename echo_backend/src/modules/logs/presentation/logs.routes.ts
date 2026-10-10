import type { EchoError, GetLogsParams, Log } from '@echo/utilities'
import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyPluginOptions,
  onRequestAsyncHookHandler
} from 'fastify'

import type { LogsController } from './logs.controller.js'
import { GetLogsParamsJsonSchema, LogJsonSchema, LogCategoryJsonSchema } from './logs.schemas.js'

/** Options of the `logsRoutes` plugin. */
export interface LogsRoutesOptions extends FastifyPluginOptions {
  controller: LogsController
  /**
   * Checks who sends each request, before anything else is done with it (its query is not
   * validated yet), and may answer in place of the route.
   */
  authenticate?: onRequestAsyncHookHandler
}

/** Registers `GET /logs`, which runs `authenticate` first when one is given. */
export const logsRoutes: FastifyPluginAsync<LogsRoutesOptions> = async (
  server: FastifyInstance,
  { controller, authenticate }
): Promise<void> => {
  server.addSchema(LogCategoryJsonSchema)
  server.addSchema(LogJsonSchema)

  server.route<{ Querystring: GetLogsParams; Reply: Log[] | EchoError }>({
    method: 'GET',
    url: '/logs',
    schema: {
      operationId: 'getLogs',
      querystring: GetLogsParamsJsonSchema,
      response: {
        200: {
          description: 'Returned Logs successfully.',
          type: 'array',
          items: { $ref: 'Log#' }
        },
        400: { description: 'Request is invalid and cannot be processed.', $ref: 'EchoError#' },
        401: {
          description: 'Unauthorized, user needs to be authenticated.',
          $ref: 'EchoError#'
        },
        500: {
          description: 'An internal server error occurred while handling the request.',
          $ref: 'EchoError#'
        }
      },
      tags: ['Logs']
    },
    ...(authenticate && { onRequest: authenticate }),
    handler: controller.getLogs
  })
}

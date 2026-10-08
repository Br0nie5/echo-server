import type { EchoError, GetLogsParams, Log } from '@echo/utilities'
import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyPluginOptions,
  preHandlerAsyncHookHandler
} from 'fastify'

import type { LogsController } from './logs.controller.js'
import { GetLogsParamsQuerySchema, LogQuerySchema, LogCategoryQuerySchema } from './logs.schemas.js'

/** Options of the `logsRoutes` plugin. */
export interface LogsRoutesOptions extends FastifyPluginOptions {
  controller: LogsController
  /** Runs before the handler of each route, and may answer in its place. */
  preHandler?: preHandlerAsyncHookHandler
}

/** Registers `GET /logs`, which runs `preHandler` first when one is given. */
export const logsRoutes: FastifyPluginAsync<LogsRoutesOptions> = async (
  server: FastifyInstance,
  { controller, preHandler }
): Promise<void> => {
  server.addSchema(LogCategoryQuerySchema)
  server.addSchema(LogQuerySchema)

  server.route<{ Querystring: GetLogsParams; Reply: Log[] | undefined | EchoError }>({
    method: 'GET',
    url: '/logs',
    schema: {
      operationId: 'getLogs',
      querystring: GetLogsParamsQuerySchema,
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
    ...(preHandler && { preHandler }),
    handler: controller.getLogs
  })
}

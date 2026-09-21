import type { EchoError, GetLogsParams, Log } from '@echo/utilities'
import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify'

import { requireAuthentication } from '../auth/auth.hooks.js'

import type { LogsController } from './logs.controller.js'
import { LogCategorySchema, LogSchema } from './logs.schemas.js'

/** Options of the `logsRoutes` plugin. */
export interface LogsRoutesOptions extends FastifyPluginOptions {
  controller: LogsController
  hasAuthentication: boolean
}

/** Registers `GET /logs`, protected by `requireAuthentication` when `hasAuthentication` is set. */
export const logsRoutes: FastifyPluginAsync<LogsRoutesOptions> = async (
  server: FastifyInstance,
  { controller, hasAuthentication }
): Promise<void> => {
  server.addSchema(LogCategorySchema)
  server.addSchema(LogSchema)

  server.route<{ Querystring: GetLogsParams; Reply: Log[] | undefined | EchoError }>({
    method: 'GET',
    url: '/logs',
    schema: {
      operationId: 'getLogs',
      querystring: {
        type: 'object',
        properties: {
          fromDate: { type: 'string', format: 'date-time' },
          logCategories: {
            oneOf: [
              { $ref: 'LogCategory#' },
              {
                type: 'array',
                items: { $ref: 'LogCategory#' },
                minItems: 2
              }
            ]
          },
          logSearch: { type: 'string' }
        },
        required: ['fromDate']
      },
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
    ...(hasAuthentication && { preHandler: requireAuthentication }),
    handler: controller.getLogs
  })
}

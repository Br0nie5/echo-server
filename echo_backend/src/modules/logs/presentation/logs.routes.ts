import type { EchoError, Log } from '@echo/utilities'
import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyPluginOptions,
  onRequestAsyncHookHandler
} from 'fastify'

import type { LogsController } from './logs.controller.js'
import { GetLogsParamsJsonSchema, LogJsonSchema, LogLevelJsonSchema } from './logs.schemas.js'
import { safeParseGetLogsParams, type ParsedGetLogsParams } from './utils/safeParseGetLogsParams.js'

/** Options of the `logsRoutes` plugin. */
export interface LogsRoutesOptions extends FastifyPluginOptions {
  controller: LogsController
  /**
   * Checks who sends each request, before anything else is done with it (its query is not
   * validated yet), and may answer in place of the route.
   */
  authenticate?: onRequestAsyncHookHandler
}

/**
 * Registers `GET /logs`, which runs `authenticate` first when one is given.
 *
 * Its query is validated by `safeParseGetLogsParams`, not by its JSON schema, which only documents
 * it: an invalid one is answered a 400 `EchoError` with the message of its first issue, which
 * names what is wrong, and a valid one reaches the handler parsed.
 */
export const logsRoutes: FastifyPluginAsync<LogsRoutesOptions> = async (
  server: FastifyInstance,
  { controller, authenticate }
): Promise<void> => {
  server.addSchema(LogLevelJsonSchema)
  server.addSchema(LogJsonSchema)

  server.route<{ Querystring: ParsedGetLogsParams; Reply: Log[] | EchoError }>({
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
    // The JSON schema of the query carries the regular expression of its dates, which Fastify
    // would answer as the message of an invalid date.
    validatorCompiler:
      () =>
      (query: unknown): { value: ParsedGetLogsParams } | { error: Error } => {
        const parsedParams = safeParseGetLogsParams(query)

        return parsedParams.success
          ? { value: parsedParams.data }
          : { error: new Error(parsedParams.error.issues[0].message) }
      },
    ...(authenticate && { onRequest: authenticate }),
    handler: controller.getLogs
  })
}

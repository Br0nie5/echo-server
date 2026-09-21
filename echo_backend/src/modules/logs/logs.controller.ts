import { parseLogSearchInput, type EchoError, type GetLogsParams, type Log } from '@echo/utilities'
import type { FastifyRequest, FastifyReply } from 'fastify'

import type { LogsService } from './logs.service.js'
import { GetLogsParamsSchema } from './utils/schemas/getLogsParams.schema.js'

/** Request handlers of the logs routes. */
export interface LogsController {
  /** Validates the query (400 on failure), then answers with the matching logs, newest first. */
  getLogs: (
    request: FastifyRequest<{ Querystring: GetLogsParams }>,
    reply: FastifyReply<{ Reply: Log[] | EchoError }>
  ) => Promise<void>
}

/** Builds the logs handlers on top of `logsService`. */
export const createLogsController = (logsService: LogsService): LogsController => ({
  getLogs: async (
    request: FastifyRequest<{ Querystring: GetLogsParams }>,
    reply: FastifyReply<{ Reply: Log[] | EchoError }>
  ): Promise<void> => {
    const parsedParams = GetLogsParamsSchema.safeParse(request.query)

    if (!parsedParams.success) {
      const error: EchoError = {
        statusCode: 400,
        message: parsedParams.error.issues[0].message
      }
      return reply.status(error.statusCode).send(error)
    }

    const { fromDate, logCategories, logSearch } = parsedParams.data

    const logSearchFilters = parseLogSearchInput(logSearch ?? '')

    const logs = await logsService.getAllLastLogs({
      fromDate,
      categories: logCategories,
      searchFilters: logSearchFilters
    })
    reply.status(200).send(logs)
    return
  }
})

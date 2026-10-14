import { parseLogSearchInput, type EchoError, type Log } from '@echo/utilities'
import type { FastifyRequest, FastifyReply } from 'fastify'

import { getFilteredLogs } from '../application/getFilteredLogs.js'
import type { LogsRepository } from '../domain/logs.repository.js'

import type { ParsedGetLogsParams } from './utils/safeParseGetLogsParams.js'

/** Request handlers of the logs routes. */
export interface LogsController {
  /**
   * Answers the logs matching the query, newest first, the query being validated and parsed by
   * the route.
   */
  getLogs: (
    request: FastifyRequest<{ Querystring: ParsedGetLogsParams }>,
    reply: FastifyReply<{ Reply: Log[] | EchoError }>
  ) => Promise<void>
}

/** Builds the logs handlers, which read the logs from `logsRepository`. */
export const createLogsController = (logsRepository: LogsRepository): LogsController => ({
  getLogs: async (
    request: FastifyRequest<{ Querystring: ParsedGetLogsParams }>,
    reply: FastifyReply<{ Reply: Log[] | EchoError }>
  ): Promise<void> => {
    const { fromDate, toDate, logLevels, logSearch } = request.query

    const logs = await getFilteredLogs(logsRepository, {
      fromDate,
      toDate,
      levels: logLevels,
      searchFilters: parseLogSearchInput(logSearch ?? '')
    })
    return reply.status(200).send(logs)
  }
})

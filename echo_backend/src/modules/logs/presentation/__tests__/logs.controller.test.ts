import type { EchoError, GetLogsParams, Log } from '@echo/utilities'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'

import type { LogsRepository } from '../../domain/logs.repository.js'
import { createLogsController } from '../logs.controller.js'

describe('createLogsController', () => {
  describe('getLogs', () => {
    it('Should answer a 400 naming the wrong field of a query the JSON schema of the route did not check', async () => {
      const logsRepository: LogsRepository = { getAllLogs: vi.fn() }
      const request = {
        query: { fromDate: 'yesterday' }
      } as FastifyRequest<{ Querystring: GetLogsParams }>
      const reply = { status: vi.fn().mockReturnThis(), send: vi.fn() }

      const controller = createLogsController(logsRepository)

      await controller.getLogs(
        request,
        reply as unknown as FastifyReply<{ Reply: Log[] | EchoError }>
      )

      expect(reply.status).toHaveBeenCalledExactlyOnceWith(400)
      expect(reply.send).toHaveBeenCalledExactlyOnceWith({
        statusCode: 400,
        message: 'Field fromDate is not a valid date, it should be an ISO string'
      })
      expect(logsRepository.getAllLogs).not.toHaveBeenCalled()
    })
  })
})

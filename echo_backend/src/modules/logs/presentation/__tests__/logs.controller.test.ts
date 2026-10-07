import {
  LogCategory as LogCategoryConst,
  type EchoError,
  type GetLogsParams,
  type Log,
  type LogCategory
} from '@echo/utilities'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { getFilteredLogs } from '../../application/getFilteredLogs.js'
import { createLogsController } from '../logs.controller.js'

vi.mock('../../application/getFilteredLogs.js')

describe('LogsController.getLogs', () => {
  const mockReply = (): FastifyReply<{ Reply: Log[] | EchoError }> => {
    const status = vi.fn().mockReturnThis()
    const send = vi.fn()
    return { status, send } as unknown as FastifyReply<{ Reply: Log[] | EchoError }>
  }

  const mockRequest = (
    query: Partial<GetLogsParams>
  ): FastifyRequest<{
    Querystring: GetLogsParams
  }> => {
    return { query } as unknown as FastifyRequest<{
      Querystring: GetLogsParams
    }>
  }

  const mockLogs: Log[] = [
    {
      id: '1',
      date: new Date().toISOString(),
      fileName: 'f',
      groupName: 'grp',
      jobId: 1,
      category: 'INFO',
      message: 'test',
      callFile: 'f.sh',
      callLine: 1
    }
  ]

  const mockGetFilteredLogs = vi.mocked(getFilteredLogs)
  const logsRepository = { findAllLogs: vi.fn() }
  const LogsController = createLogsController(logsRepository)

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return a 400 if fromDate is missing', async () => {
    const req = mockRequest({})
    const reply = mockReply()

    await LogsController.getLogs(req, reply)

    expect(reply.status).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Missing required field: fromDate'
    })
  })

  it('should return 400 if fromDate is invalid', async () => {
    const req = mockRequest({ fromDate: 'invalid-date' })
    const reply = mockReply()

    await LogsController.getLogs(req, reply)

    expect(reply.status).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Field fromDate is not a valid date, it should be an ISO string'
    })
  })

  it('should return 400 if an invalid log category is given', async () => {
    const req = mockRequest({
      fromDate: new Date().toISOString(),
      logCategories: 'Invalid_log_category' as LogCategory
    })
    const reply = mockReply()

    await LogsController.getLogs(req, reply)

    expect(reply.status).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: 400,
      message: `Invalid_log_category is not a valid log category, use ${Object.values(LogCategoryConst).join('|')}`
    })
  })

  it('should return 200 with logs when request is valid', async () => {
    const req = mockRequest({ fromDate: new Date().toISOString() })
    const reply = mockReply()

    mockGetFilteredLogs.mockResolvedValue(mockLogs)

    await LogsController.getLogs(req, reply)

    expect(mockGetFilteredLogs).toHaveBeenCalledWith(logsRepository, expect.any(Object))
    expect(reply.status).toHaveBeenCalledWith(200)
    expect(reply.send).toHaveBeenCalledWith(mockLogs)
  })

  it('should return 200 with an empty array when no logs found', async () => {
    const req = mockRequest({ fromDate: new Date().toISOString() })
    const reply = mockReply()

    mockGetFilteredLogs.mockResolvedValue([])

    await LogsController.getLogs(req, reply)

    expect(reply.status).toHaveBeenCalledWith(200)
    expect(reply.send).toHaveBeenCalledWith([])
  })
})

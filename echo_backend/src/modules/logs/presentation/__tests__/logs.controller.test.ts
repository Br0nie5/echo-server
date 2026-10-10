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

/** The `fromDate` the client sends, and the date of the logs. */
const FROM_DATE = '2026-01-01T00:00:00.000Z'

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
      date: FROM_DATE,
      location: '/logs/f.jsonl',
      locationName: 'f',
      groupName: 'grp',
      jobId: 1,
      category: 'INFO',
      message: 'test',
      callFile: 'f.sh',
      callLine: 1
    }
  ]

  const mockGetFilteredLogs = vi.mocked(getFilteredLogs)
  const logsRepository = {
    getAllLogs: vi.fn(),
    getLogs: vi.fn(),
    saveLogs: vi.fn(),
    deleteLogs: vi.fn()
  }
  const selfReportRepository = { saveSelfReports: vi.fn() }
  const LogsController = createLogsController(logsRepository, selfReportRepository)

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('Should return a 400 if fromDate is missing', async () => {
    const request = mockRequest({})
    const reply = mockReply()

    await LogsController.getLogs(request, reply)

    expect(reply.status).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Missing required field: fromDate'
    })
  })

  it('Should return 400 if fromDate is invalid', async () => {
    const request = mockRequest({ fromDate: 'invalid-date' })
    const reply = mockReply()

    await LogsController.getLogs(request, reply)

    expect(reply.status).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Field fromDate is not a valid date, it should be an ISO string'
    })
  })

  it('Should return 400 if an invalid log category is given', async () => {
    const request = mockRequest({
      fromDate: FROM_DATE,
      logCategories: 'Invalid_log_category' as LogCategory
    })
    const reply = mockReply()

    await LogsController.getLogs(request, reply)

    expect(reply.status).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: 400,
      message: `Invalid_log_category is not a valid log category, use ${Object.values(LogCategoryConst).join('|')}`
    })
  })

  it('Should return 200 with logs when request is valid', async () => {
    const request = mockRequest({ fromDate: FROM_DATE })
    const reply = mockReply()

    mockGetFilteredLogs.mockResolvedValue(mockLogs)

    await LogsController.getLogs(request, reply)

    expect(mockGetFilteredLogs).toHaveBeenCalledWith(
      logsRepository,
      selfReportRepository,
      expect.any(Object)
    )
    expect(reply.status).toHaveBeenCalledWith(200)
    expect(reply.send).toHaveBeenCalledWith(mockLogs)
  })

  it('Should look the logs up between fromDate and toDate', async () => {
    const request = mockRequest({
      fromDate: '2026-01-01T00:00:00.000Z',
      toDate: '2026-01-02T00:00:00.000Z',
      logCategories: LogCategoryConst.ERROR
    })
    mockGetFilteredLogs.mockResolvedValue([])

    await LogsController.getLogs(request, mockReply())

    expect(mockGetFilteredLogs).toHaveBeenCalledWith(logsRepository, selfReportRepository, {
      fromDate: new Date('2026-01-01T00:00:00.000Z'),
      toDate: new Date('2026-01-02T00:00:00.000Z'),
      categories: [LogCategoryConst.ERROR],
      searchFilters: []
    })
  })

  it('Should return 200 with an empty array when no logs found', async () => {
    const request = mockRequest({ fromDate: FROM_DATE })
    const reply = mockReply()

    mockGetFilteredLogs.mockResolvedValue([])

    await LogsController.getLogs(request, reply)

    expect(reply.status).toHaveBeenCalledWith(200)
    expect(reply.send).toHaveBeenCalledWith([])
  })
})

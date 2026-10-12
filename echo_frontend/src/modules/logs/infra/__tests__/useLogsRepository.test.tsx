import { createLogWithIds, LogLevel, type GetLogsParams, type Log } from '@echo/utilities'
import nock from 'nock'
import { describe, expect, test } from 'vitest'

import { mockConfig } from '../../../../test/mocks/mockConfig'
import { renderAppHook } from '../../../../test/renderAppHook'
import { useLogsRepository } from '../useLogsRepository'

const buildLogsRequestMock = (params: GetLogsParams): nock.Interceptor => {
  return nock(mockConfig.API_URL).get('/logs').query(params)
}

const logMock: Log = createLogWithIds(
  {
    date: '2026-04-27T10:00:00.000Z',
    location: '/storage/billing/send_invoices',
    locationName: 'send_invoices',
    jobId: 1,
    level: LogLevel.INFO,
    message: 'some message',
    groupName: 'billing',
    origin: 'send_invoices.sh:12'
  },
  0
)

describe('useLogsRepository', () => {
  describe('findLogs', () => {
    test('Should throw if the API response does not match the Log schema', async () => {
      const params: GetLogsParams = { fromDate: '2026-04-26T00:00:00.000Z' }

      buildLogsRequestMock(params).reply(200, [{ ...logMock, jobId: 'not a number' }])

      const { result } = renderAppHook(() => useLogsRepository())

      await expect(result.current.findLogs(params)).rejects.toThrow()
    })
  })
})

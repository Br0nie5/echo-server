import { LogCategory, type GetLogsParams, type Log } from '@echo/utilities'
import nock from 'nock'
import { describe, expect, test } from 'vitest'

import { renderAppHook } from '../../../../test/renderAppHook'
import { testConfig } from '../../../../test/utils/config'
import { useLogsRepository } from '../useLogsRepository'

const buildLogsRequestMock = (params: GetLogsParams): nock.Interceptor => {
  return nock(testConfig.API_URL).get('/logs').query(params)
}

const logMock: Log = {
  id: '1 [group] [file] [1] [2026-04-27 10:00:00.000] [INFO] some message',
  date: '2026-04-27T10:00:00.000Z',
  location: '/logs/file.jsonl',
  locationName: 'file',
  jobId: 1,
  category: LogCategory.INFO,
  message: 'some message',
  groupName: 'group',
  callFile: 'file.sh',
  callLine: 1
}

describe('useLogsRepository', () => {
  describe('findLogs', () => {
    test('should throw if the API response does not match the Log schema', async () => {
      const params: GetLogsParams = { fromDate: '2026-04-26T00:00:00.000Z' }

      buildLogsRequestMock(params).reply(200, [{ ...logMock, jobId: 'not a number' }])

      const { result } = renderAppHook(() => useLogsRepository())

      await expect(result.current.findLogs(params)).rejects.toThrow()
    })
  })
})

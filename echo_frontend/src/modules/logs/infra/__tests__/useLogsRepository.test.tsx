import type { GetLogsParams } from '@echo/utilities'
import nock from 'nock'

import { buildLog } from '../../../../test/mocks/buildLog'
import { mockAppUrls } from '../../../../test/mocks/mockConfig'
import { renderAppHook } from '../../../../test/renderAppHook'
import { useLogsRepository } from '../useLogsRepository'

describe('useLogsRepository', () => {
  describe('findLogs', () => {
    test('Should throw if the API response does not match the Log schema', async () => {
      const params: GetLogsParams = { fromDate: '2026-04-26T00:00:00.000Z' }

      nock(mockAppUrls.apiUrl)
        .get('/logs')
        .query(params)
        .reply(200, [{ ...buildLog(), jobId: 'not a number' }])

      const { result } = renderAppHook(() => useLogsRepository())

      await expect(result.current.findLogs(params)).rejects.toThrow()
    })
  })
})

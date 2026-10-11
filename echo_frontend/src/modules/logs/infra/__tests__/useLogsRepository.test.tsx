import { createLogWithIds, LogLevel, type GetLogsParams, type Log } from '@echo/utilities'
import nock from 'nock'
import { describe, expect, test } from 'vitest'

import { renderAppHook } from '../../../../test/renderAppHook'
import { mockConfig } from '../../../../test/utils/mockConfig'
import { useLogsRepository } from '../useLogsRepository'

const buildLogsRequestMock = (params: GetLogsParams): nock.Interceptor => {
  return nock(mockConfig.API_URL).get('/logs').query(params)
}

const logMock: Log = createLogWithIds(
  {
    date: '2026-04-27T10:00:00.000Z',
    location: '/server/docker_utils/logs/prune_images.jsonl',
    locationName: 'prune_images',
    jobId: 1,
    level: LogLevel.INFO,
    message: 'some message',
    groupName: 'docker_utils',
    origin: '/server/docker_utils/prune_images.sh:12'
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

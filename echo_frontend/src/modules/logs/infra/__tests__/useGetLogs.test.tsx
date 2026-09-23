import { LogCategory, type GetLogsParams, type Log } from '@echo/utilities'
import { waitFor } from '@testing-library/react'
import type { Interceptor, Scope } from 'nock'
import nock from 'nock'
import { describe, expect, test } from 'vitest'

import { renderAppHook } from '../../../../test/renderAppHook'
import { testEnv } from '../../../../test/utils/env'
import { getGetLogsQueryKey } from '../getLogsQueryKey'
import { useGetLogs } from '../useGetLogs'

const buildRequestMockScope = (): Scope => {
  return nock(testEnv.API_URL)
}

const buildLogsRequestMock = (params: GetLogsParams): Interceptor => {
  const logsUri = getGetLogsQueryKey(params)[0]

  return buildRequestMockScope().get(logsUri).query(params)
}

const logMock: Log = {
  id: '1 [group] [file] [1] [2026-04-27 10:00:00.000] [INFO] some message',
  date: '2026-04-27T10:00:00.000Z',
  fileName: 'file',
  jobId: 1,
  category: LogCategory.INFO,
  message: 'some message',
  groupName: 'group',
  callFile: 'file.sh',
  callLine: 1
}

describe('useGetLogs', () => {
  test('should error if the API response does not match the Log schema', async () => {
    const params: GetLogsParams = { fromDate: '2026-04-26T00:00:00.000Z' }

    buildLogsRequestMock(params).reply(200, [{ ...logMock, jobId: 'not a number' }])

    const { result } = renderAppHook(() => useGetLogs(params))

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

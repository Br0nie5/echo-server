import { waitFor } from '@testing-library/react'
import type { Interceptor, Scope } from 'nock'
import nock from 'nock'
import { describe, expect, test } from 'vitest'

import { renderAppHook } from '../../../../test/renderAppHook'
import { testEnv } from '../../../../test/utils/env'
import { getAuthCheckQueryKey } from '../keys/getAuthCheckQueryKey'
import { useGetAuthCheck } from '../useGetAuthCheck'

const buildRequestMockScope = (): Scope => {
  return nock(testEnv.API_URL)
}

const buildAuthCheckRequestMock = (): Interceptor => {
  const authCheckUri = getAuthCheckQueryKey[0]

  return buildRequestMockScope().get(authCheckUri).query({})
}

describe('useGetAuthCheck', () => {
  test('should treat a malformed 401 auth check body as needing login, not sign up', async () => {
    buildAuthCheckRequestMock().reply(401, { success: 'not-a-boolean' })

    const { result } = renderAppHook(() => useGetAuthCheck())

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBe('login')
  })

  test('should error if a successful auth check response does not match the AuthToken schema', async () => {
    buildAuthCheckRequestMock().reply(200, { success: 'not-a-boolean' })

    const { result } = renderAppHook(() => useGetAuthCheck())

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Invalid auth token format')
  })
})

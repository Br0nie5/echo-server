import nock from 'nock'
import { describe, expect, test, vi } from 'vitest'

import { renderAppHook } from '../../../test/renderAppHook'
import { testEnv } from '../../../test/utils/env'
import { useApiMutator } from '../useApiMutator'

describe('useApiMutator', () => {
  test('should return the response data on success', async () => {
    nock(testEnv.API_URL).get('/ok').reply(200, { hello: 'world' })

    const { result } = renderAppHook(() => useApiMutator())

    await expect(result.current({ url: '/ok', method: 'GET' })).resolves.toEqual({ hello: 'world' })
  })

  test('should only run the error interceptor of the request that failed', async () => {
    nock(testEnv.API_URL).get('/failing').reply(500)
    nock(testEnv.API_URL).get('/ok').delay(20).reply(200, {})

    const { result } = renderAppHook(() => useApiMutator())
    const otherRequestInterceptor = vi.fn()

    const okRequest = result.current({
      url: '/ok',
      method: 'GET',
      errorInterceptor: otherRequestInterceptor
    })
    await expect(result.current({ url: '/failing', method: 'GET' })).rejects.toThrow()
    await okRequest

    expect(otherRequestInterceptor).not.toHaveBeenCalled()
  })

  test('should not keep the error interceptor of a failed request for later requests', async () => {
    nock(testEnv.API_URL).get('/first').reply(500)
    nock(testEnv.API_URL).get('/second').reply(500)

    const { result } = renderAppHook(() => useApiMutator())
    const errorInterceptor = vi.fn()

    await expect(
      result.current({ url: '/first', method: 'GET', errorInterceptor })
    ).rejects.toThrow()
    await expect(result.current({ url: '/second', method: 'GET' })).rejects.toThrow()

    expect(errorInterceptor).toHaveBeenCalledTimes(1)
  })
})

import nock from 'nock'
import type { Location } from 'react-router-dom'
import { describe, expect, test, vi } from 'vitest'

import { renderAppHook } from '../../../test/renderAppHook'
import { mockConfig } from '../../../test/utils/mockConfig'
import { AppPathNames } from '../../navigation/pathNames'
import { useSendApiRequest } from '../useSendApiRequest'

describe('useSendApiRequest', () => {
  test('Should return the response data on success', async () => {
    nock(mockConfig.API_URL).get('/ok').reply(200, { hello: 'world' })

    const { result } = renderAppHook(() => useSendApiRequest())

    await expect(result.current({ url: '/ok', method: 'GET' })).resolves.toEqual({ hello: 'world' })
  })

  test('Should throw, and stay on the page, when the request fails', async () => {
    nock(mockConfig.API_URL).get('/failing').reply(500)
    const onLocationChange = vi.fn<(location: Location) => void>()

    const { result } = renderAppHook(() => useSendApiRequest(), { onLocationChange })

    await expect(result.current({ url: '/failing', method: 'GET' })).rejects.toThrow()
    expect(onLocationChange).toHaveBeenCalledTimes(1)
  })

  test('Should throw, and go to the auth screen to come back to the page, when the API answers a 401', async () => {
    nock(mockConfig.API_URL).get('/protected').reply(401)
    const onLocationChange = vi.fn<(location: Location) => void>()

    const { result } = renderAppHook(() => useSendApiRequest(), {
      path: `${AppPathNames.logs}?logSearch=text`,
      onLocationChange
    })

    await expect(result.current({ url: '/protected', method: 'GET' })).rejects.toThrow()
    await vi.waitFor(() =>
      expect(onLocationChange.mock.lastCall?.[0]).toMatchObject({
        pathname: AppPathNames.auth,
        search: `?${new URLSearchParams({ redirect: `${AppPathNames.logs}?logSearch=text` })}`
      })
    )
  })

  test('Should throw, and stay on the auth screen, when the API answers a 401 there', async () => {
    nock(mockConfig.API_URL).get('/auth/check').reply(401)
    const onLocationChange = vi.fn<(location: Location) => void>()

    const { result } = renderAppHook(() => useSendApiRequest(), {
      path: AppPathNames.auth,
      onLocationChange
    })

    await expect(result.current({ url: '/auth/check', method: 'GET' })).rejects.toThrow()
    expect(onLocationChange).toHaveBeenCalledTimes(1)
  })
})

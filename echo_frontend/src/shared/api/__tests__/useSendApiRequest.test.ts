import { act } from '@testing-library/react'
import nock from 'nock'
import type { Location } from 'react-router-dom'

import { mockAppUrls } from '../../../test/mocks/mockConfig'
import { renderAppHook } from '../../../test/renderAppHook'
import { AppPathNames } from '../../navigation/pathNames'
import { useSendApiRequest } from '../useSendApiRequest'

describe('useSendApiRequest', () => {
  test('Should return the response data on success', async () => {
    nock(mockAppUrls.apiUrl).get('/ok').reply(200, { hello: 'world' })

    const { result } = renderAppHook(() => useSendApiRequest())

    await expect(result.current({ url: '/ok', method: 'GET' })).resolves.toEqual({ hello: 'world' })
  })

  test('Should throw, and stay on the page, when the request fails', async () => {
    nock(mockAppUrls.apiUrl).get('/failing').reply(500)
    const onLocationChange = vi.fn<(location: Location) => void>()

    const { result } = renderAppHook(() => useSendApiRequest(), { onLocationChange })

    await act(() => expect(result.current({ url: '/failing', method: 'GET' })).rejects.toThrow())

    expect(onLocationChange).toHaveBeenCalledTimes(1)
  })

  test('Should throw, and go to the auth screen to come back to the page, when the API answers a 401', async () => {
    nock(mockAppUrls.apiUrl).get('/protected').reply(401)
    const onLocationChange = vi.fn<(location: Location) => void>()

    const { result } = renderAppHook(() => useSendApiRequest(), {
      path: `${AppPathNames.logs}?logSearch=text`,
      onLocationChange
    })

    await act(() => expect(result.current({ url: '/protected', method: 'GET' })).rejects.toThrow())

    expect(onLocationChange.mock.lastCall?.[0]).toMatchObject({
      pathname: AppPathNames.auth,
      search: `?${new URLSearchParams({ redirect: `${AppPathNames.logs}?logSearch=text` })}`
    })
  })

  test('Should throw, and stay on the auth screen, when the API answers a 401 there', async () => {
    nock(mockAppUrls.apiUrl).post('/auth/login').reply(401)
    const onLocationChange = vi.fn<(location: Location) => void>()

    const { result } = renderAppHook(() => useSendApiRequest(), {
      path: AppPathNames.auth,
      onLocationChange
    })

    await act(() =>
      expect(result.current({ url: '/auth/login', method: 'POST' })).rejects.toThrow()
    )

    expect(onLocationChange).toHaveBeenCalledTimes(1)
  })
})

import nock from 'nock'

import { mockAppUrls } from '../../../../test/mocks/mockConfig'
import { renderAppHook } from '../../../../test/renderAppHook'
import { useAuthRepository } from '../useAuthRepository'

describe('useAuthRepository', () => {
  describe('checkAuthentication', () => {
    test('Should throw if the answer of the API does not match the AuthStatus schema', async () => {
      nock(mockAppUrls.apiUrl).get('/auth/status').reply(200, { status: 'loggedOut' })

      const { result } = renderAppHook(() => useAuthRepository())

      await expect(result.current.checkAuthentication()).rejects.toThrow()
    })
  })
})

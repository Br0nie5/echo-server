import nock from 'nock'
import { describe, expect, test } from 'vitest'

import { mockConfig } from '../../../../test/mocks/mockConfig'
import { renderAppHook } from '../../../../test/renderAppHook'
import { InvalidCredentialsError } from '../../domain/auth.repository'
import { useAuthRepository } from '../useAuthRepository'

const buildRequestMockScope = (): nock.Scope => {
  return nock(mockConfig.API_URL)
}

describe('useAuthRepository', () => {
  describe('checkAuthentication', () => {
    test('Should throw if the answer of the API does not match the AuthStatus schema', async () => {
      buildRequestMockScope().get('/auth/status').reply(200, { status: 'loggedOut' })

      const { result } = renderAppHook(() => useAuthRepository())

      await expect(result.current.checkAuthentication()).rejects.toThrow()
    })
  })

  describe('login', () => {
    test('Should throw an InvalidCredentialsError if the API refuses the credentials', async () => {
      buildRequestMockScope()
        .post('/auth/login')
        .reply(401, { statusCode: 401, message: 'Invalid credentials.' })

      const { result } = renderAppHook(() => useAuthRepository())

      await expect(
        result.current.login({ username: 'bad-user', password: 'bad-pass' })
      ).rejects.toBeInstanceOf(InvalidCredentialsError)
    })
  })
})

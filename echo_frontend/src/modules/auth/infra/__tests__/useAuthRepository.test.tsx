import nock from 'nock'
import { describe, expect, test } from 'vitest'

import { renderAppHook } from '../../../../test/renderAppHook'
import { mockConfig } from '../../../../test/utils/mockConfig'
import { InvalidCredentialsError } from '../../domain/auth.repository'
import { useAuthRepository } from '../useAuthRepository'

const buildRequestMockScope = (): nock.Scope => {
  return nock(mockConfig.API_URL)
}

const buildAuthCheckRequestMock = (): nock.Interceptor => {
  return buildRequestMockScope().get('/auth/check').query({})
}

describe('useAuthRepository', () => {
  describe('checkAuthentication', () => {
    test('Should treat a malformed 401 auth check body as needing login, not sign up', async () => {
      buildAuthCheckRequestMock().reply(401, { success: 'not-a-boolean' })

      const { result } = renderAppHook(() => useAuthRepository())

      await expect(result.current.checkAuthentication()).resolves.toBe('login')
    })

    test('Should throw if a successful auth check response does not match the AuthToken schema', async () => {
      buildAuthCheckRequestMock().reply(200, { success: 'not-a-boolean' })

      const { result } = renderAppHook(() => useAuthRepository())

      await expect(result.current.checkAuthentication()).rejects.toThrow(
        'Invalid auth token format'
      )
    })
  })

  describe('login', () => {
    test('Should throw an InvalidCredentialsError if the backend refuses the credentials', async () => {
      buildRequestMockScope()
        .post('/auth/login')
        .reply(401, { success: false, message: 'Invalid credentials.' })

      const { result } = renderAppHook(() => useAuthRepository())

      await expect(
        result.current.login({ username: 'bad-user', password: 'bad-pass' })
      ).rejects.toBeInstanceOf(InvalidCredentialsError)
    })
  })
})

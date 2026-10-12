import type { AuthToken, SignUpRequest } from '@echo/utilities'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'

import { getMockAuthConfig } from '../../../../test/mocks/mockConfigs.js'
import type { AuthRepository } from '../../domain/auth.repository.js'
import { createAuthController } from '../auth.controller.js'

// The routes are tested through the server (`auth.routes.test.ts`). Here is only what no request
// can make happen: the storage of the accounts failing.
describe('createAuthController', () => {
  describe('signUp', () => {
    it('Should throw the error of a sign up that fails for another reason than being refused', async () => {
      const storageError = new Error('The database is locked.')
      const authRepository: AuthRepository = {
        hasAnyUser: vi.fn().mockResolvedValue(false),
        createUser: vi.fn().mockRejectedValue(storageError),
        areCredentialsValid: vi.fn()
      }
      const request = {
        body: { username: 'admin', password: 'secret' }
      } as FastifyRequest<{ Body: SignUpRequest }>
      const reply = { setCookie: vi.fn() } as unknown as FastifyReply<{ Reply: AuthToken }>

      const controller = createAuthController(authRepository, getMockAuthConfig())

      await expect(controller.signUp(request, reply)).rejects.toBe(storageError)
      expect(reply.setCookie).not.toHaveBeenCalled()
    })
  })
})

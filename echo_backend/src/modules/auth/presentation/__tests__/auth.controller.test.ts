import { needsSignupMessage, type AuthToken, type LoginRequest } from '@echo/utilities'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { getMockAuthConfig } from '../../../../test/mocks/mockConfigs.js'
import { SignUpRefusedError } from '../../domain/signUpRefusedError.js'
import { createAuthController } from '../auth.controller.js'

const mockReply = (): FastifyReply<{ Reply: AuthToken }> => {
  const status = vi.fn().mockReturnThis()
  const send = vi.fn().mockReturnThis()
  const setCookie = vi.fn().mockReturnThis()
  const clearCookie = vi.fn().mockReturnThis()
  return { status, send, setCookie, clearCookie } as unknown as FastifyReply<{ Reply: AuthToken }>
}

const mockRequest = (
  body: Partial<LoginRequest>,
  jwtVerify: () => Promise<void> | void = vi.fn()
): FastifyRequest<{ Body: LoginRequest }> => {
  return {
    body,
    server: { jwt: { sign: vi.fn().mockReturnValue('mocked.jwt.token') } },
    log: { warn: vi.fn() },
    jwtVerify
  } as unknown as FastifyRequest<{ Body: LoginRequest }>
}

const username = 'test_admin'
const password = 'some_password'

const authConfig = getMockAuthConfig()
const AuthRepository = {
  hasAnyUser: vi.fn(),
  createUser: vi.fn(),
  areCredentialsValid: vi.fn()
}
const AuthController = createAuthController(AuthRepository, authConfig)

describe('AuthController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signUp', () => {
    it('should successfully sign up, set a cookie, and return 200 for first user', async () => {
      vi.mocked(AuthRepository.hasAnyUser).mockResolvedValue(false)

      const request = mockRequest({ username: username, password: password })
      const reply = mockReply()

      await AuthController.signUp(request, reply)

      expect(AuthRepository.createUser).toHaveBeenCalledWith({ username, password, isAdmin: true })

      expect(request.server.jwt.sign).toHaveBeenCalledWith({ user: username })
      expect(reply.setCookie).toHaveBeenCalledWith(
        authConfig.cookieName,
        'mocked.jwt.token',
        authConfig.cookieSerializeOptions
      )
      expect(reply.status).toHaveBeenCalledWith(200)
      expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Sign up successful.' })
    })

    it('should return a 403 if an user had already signed up', async () => {
      vi.mocked(AuthRepository.hasAnyUser).mockResolvedValue(true)

      const request = mockRequest({ username: username, password: password })
      const reply = mockReply()

      await AuthController.signUp(request, reply)

      expect(AuthRepository.createUser).not.toHaveBeenCalled()
      expect(request.log.warn).toHaveBeenCalledWith(
        { err: new SignUpRefusedError('An account already exists.') },
        'Sign up refused'
      )

      expect(request.server.jwt.sign).not.toHaveBeenCalled()
      expect(reply.setCookie).not.toHaveBeenCalled()

      expect(reply.status).toHaveBeenCalledWith(403)
      expect(reply.send).toHaveBeenCalledWith({ success: false, message: 'Unauthorized.' })
    })
  })

  describe('signUp failing', () => {
    it('should throw the error of a sign up that fails for another reason than being refused', async () => {
      vi.mocked(AuthRepository.hasAnyUser).mockResolvedValue(false)
      vi.mocked(AuthRepository.createUser).mockRejectedValueOnce(new Error('SQLITE_BUSY'))

      const request = mockRequest({ username: username, password: password })
      const reply = mockReply()

      await expect(AuthController.signUp(request, reply)).rejects.toThrow('SQLITE_BUSY')

      expect(reply.setCookie).not.toHaveBeenCalled()
      expect(reply.send).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('should successfully log in, set a cookie, and return 200 for valid credentials', async () => {
      vi.mocked(AuthRepository.areCredentialsValid).mockResolvedValue(true)

      const request = mockRequest({ username: username, password: password })
      const reply = mockReply()

      await AuthController.login(request, reply)

      expect(request.server.jwt.sign).toHaveBeenCalledWith({ user: username })
      expect(reply.setCookie).toHaveBeenCalledWith(
        authConfig.cookieName,
        'mocked.jwt.token',
        authConfig.cookieSerializeOptions
      )
      expect(reply.status).toHaveBeenCalledWith(200)
      expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Login successful.' })
    })

    it('should return 401 for invalid username', async () => {
      vi.mocked(AuthRepository.areCredentialsValid).mockResolvedValue(false)

      const request = mockRequest({ username: 'wrong_user', password: 'any_password' })
      const reply = mockReply()

      await AuthController.login(request, reply)

      expect(request.server.jwt.sign).not.toHaveBeenCalled()
      expect(reply.setCookie).not.toHaveBeenCalled()
      expect(reply.status).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith({ success: false, message: 'Invalid credentials.' })
    })

    it('should return 401 for valid username but invalid password', async () => {
      vi.mocked(AuthRepository.areCredentialsValid).mockResolvedValue(false)

      const request = mockRequest({ username: username, password: 'wrong_password' })
      const reply = mockReply()

      await AuthController.login(request, reply)

      expect(request.server.jwt.sign).not.toHaveBeenCalled()
      expect(reply.setCookie).not.toHaveBeenCalled()
      expect(reply.status).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith({ success: false, message: 'Invalid credentials.' })
    })
  })

  describe('check', () => {
    it('should return 200 when the JWT is successfully verified', async () => {
      vi.mocked(AuthRepository.hasAnyUser).mockResolvedValue(true)

      const request = mockRequest({}, vi.fn().mockResolvedValue({}))
      const reply = mockReply()

      await AuthController.check(request, reply)

      expect(request.jwtVerify).toHaveBeenCalledTimes(1)
      expect(reply.status).toHaveBeenCalledWith(200)
      expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Token is valid.' })
    })

    it('should return 401 when JWT verification fails', async () => {
      vi.mocked(AuthRepository.hasAnyUser).mockResolvedValue(true)

      const request = mockRequest({}, vi.fn().mockRejectedValue(new Error('Invalid token')))
      const reply = mockReply()

      await AuthController.check(request, reply)

      expect(request.jwtVerify).toHaveBeenCalledTimes(1)
      expect(reply.status).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith({ success: false, message: 'Invalid token.' })
    })

    it('should return 401 when no user are found in the db', async () => {
      vi.mocked(AuthRepository.hasAnyUser).mockResolvedValue(false)

      const request = mockRequest({}, vi.fn().mockRejectedValue(new Error(needsSignupMessage)))
      const reply = mockReply()

      await AuthController.check(request, reply)

      expect(reply.status).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith({ success: false, message: needsSignupMessage })
    })
  })

  describe('logout', () => {
    it('should clear the cookie and return 200', async () => {
      const request = mockRequest({})
      const reply = mockReply()

      await AuthController.logout(request, reply)

      expect(reply.clearCookie).toHaveBeenCalledWith(
        authConfig.cookieName,
        authConfig.cookieSerializeOptions
      )
      expect(reply.status).toHaveBeenCalledWith(200)
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully.'
      })
    })
  })
})

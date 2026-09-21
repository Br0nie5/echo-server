import { needsSignupMessage, type AuthToken, type LoginRequest } from '@echo/utilities'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, it, expect, vi, beforeEach } from 'vitest'

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
  jwtVerifyImpl: () => Promise<void> | void = vi.fn()
): FastifyRequest<{ Body: LoginRequest }> => {
  return {
    body,
    server: { jwt: { sign: vi.fn().mockReturnValue('mocked.jwt.token') } },
    jwtVerify: jwtVerifyImpl
  } as unknown as FastifyRequest<{ Body: LoginRequest }>
}

const username = 'test_admin'
const password = 'some_password'

const env = {
  COOKIE_NAME: 'test-cookie',
  COOKIE_SERIALIZE_OPTIONS: { httpOnly: true, path: '/' }
}
const AuthService = {
  needsSignup: vi.fn(),
  signUpFirstAdmin: vi.fn(),
  areCredentialsValid: vi.fn()
}
const AuthController = createAuthController(AuthService, env)

describe('AuthController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signUp', () => {
    it('should successfully sign up, set a cookie, and return 200 for first user', async () => {
      vi.mocked(AuthService.signUpFirstAdmin).mockResolvedValue(true)

      const req = mockRequest({ username: username, password: password })
      const reply = mockReply()

      await AuthController.signUp(req, reply)

      expect(req.server.jwt.sign).toHaveBeenCalledWith({ user: username })
      expect(reply.setCookie).toHaveBeenCalledWith(
        env.COOKIE_NAME,
        'mocked.jwt.token',
        env.COOKIE_SERIALIZE_OPTIONS
      )
      expect(reply.status).toHaveBeenCalledWith(200)
      expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Sign up successful.' })
    })

    it('should return a 403 if an user had already signed up', async () => {
      vi.mocked(AuthService.signUpFirstAdmin).mockResolvedValue(false)

      const req = mockRequest({ username: username, password: password })
      const reply = mockReply()

      await AuthController.signUp(req, reply)

      expect(req.server.jwt.sign).not.toHaveBeenCalled()
      expect(reply.setCookie).not.toHaveBeenCalled()

      expect(reply.status).toHaveBeenCalledWith(403)
      expect(reply.send).toHaveBeenCalledWith({ success: false, message: 'Unauthorized.' })
    })
  })

  describe('login', () => {
    it('should successfully log in, set a cookie, and return 200 for valid credentials', async () => {
      vi.mocked(AuthService.areCredentialsValid).mockResolvedValue(true)

      const req = mockRequest({ username: username, password: password })
      const reply = mockReply()

      await AuthController.login(req, reply)

      expect(req.server.jwt.sign).toHaveBeenCalledWith({ user: username })
      expect(reply.setCookie).toHaveBeenCalledWith(
        env.COOKIE_NAME,
        'mocked.jwt.token',
        env.COOKIE_SERIALIZE_OPTIONS
      )
      expect(reply.status).toHaveBeenCalledWith(200)
      expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Login successful.' })
    })

    it('should return 401 for invalid username', async () => {
      vi.mocked(AuthService.areCredentialsValid).mockResolvedValue(false)

      const req = mockRequest({ username: 'wrong_user', password: 'any_password' })
      const reply = mockReply()

      await AuthController.login(req, reply)

      expect(req.server.jwt.sign).not.toHaveBeenCalled()
      expect(reply.setCookie).not.toHaveBeenCalled()
      expect(reply.status).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith({ success: false, message: 'Invalid credentials.' })
    })

    it('should return 401 for valid username but invalid password', async () => {
      vi.mocked(AuthService.areCredentialsValid).mockResolvedValue(false)

      const req = mockRequest({ username: username, password: 'wrong_password' })
      const reply = mockReply()

      await AuthController.login(req, reply)

      expect(req.server.jwt.sign).not.toHaveBeenCalled()
      expect(reply.setCookie).not.toHaveBeenCalled()
      expect(reply.status).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith({ success: false, message: 'Invalid credentials.' })
    })
  })

  describe('check', () => {
    it('should return 200 when the JWT is successfully verified', async () => {
      vi.mocked(AuthService.needsSignup).mockReturnValue(false)

      const req = mockRequest({}, vi.fn().mockResolvedValue({}))
      const reply = mockReply()

      await AuthController.check(req, reply)

      expect(req.jwtVerify).toHaveBeenCalledTimes(1)
      expect(reply.status).toHaveBeenCalledWith(200)
      expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Token is valid.' })
    })

    it('should return 401 when JWT verification fails', async () => {
      vi.mocked(AuthService.needsSignup).mockReturnValue(false)

      const req = mockRequest({}, vi.fn().mockRejectedValue(new Error('Invalid token')))
      const reply = mockReply()

      await AuthController.check(req, reply)

      expect(req.jwtVerify).toHaveBeenCalledTimes(1)
      expect(reply.status).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith({ success: false, message: 'Invalid token.' })
    })

    it('should return 401 when no user are found in the db', async () => {
      vi.mocked(AuthService.needsSignup).mockReturnValue(true)

      const req = mockRequest({}, vi.fn().mockRejectedValue(new Error(needsSignupMessage)))
      const reply = mockReply()

      await AuthController.check(req, reply)

      expect(reply.status).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith({ success: false, message: needsSignupMessage })
    })
  })

  describe('logout', () => {
    it('should clear the cookie and return 200', async () => {
      const req = mockRequest({})
      const reply = mockReply()

      await AuthController.logout(req, reply)

      expect(reply.clearCookie).toHaveBeenCalledWith(env.COOKIE_NAME, env.COOKIE_SERIALIZE_OPTIONS)
      expect(reply.status).toHaveBeenCalledWith(200)
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully.'
      })
    })
  })
})

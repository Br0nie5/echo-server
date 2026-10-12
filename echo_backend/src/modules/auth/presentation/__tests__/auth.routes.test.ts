import { needsSignupMessage } from '@echo/utilities'
import type { LightMyRequestResponse } from 'fastify'
import { describe, expect, test } from 'vitest'

import type { EchoServer } from '../../../../initializers/types/echoServer.js'
import { createCookieSerializeOptions } from '../../../../shared/config/utils/createCookieSerializeOptions.js'
import { buildTestServer } from '../../../../test/buildTestServer.js'
import { getMockAuthConfig, getMockServerConfig } from '../../../../test/mocks/mockConfigs.js'

const IN_MEMORY_DATABASE_PATH = ':memory:'

const credentials = { username: 'admin', password: 'secret' }

const postCredentials = (
  server: EchoServer,
  route: 'signup' | 'login',
  payload: object = credentials,
  headers: Record<string, string> = {}
): Promise<LightMyRequestResponse> =>
  server.inject({ method: 'POST', url: `/api/auth/${route}`, payload, headers })

const checkAuthentication = (
  server: EchoServer,
  cookies: Record<string, string> = {}
): Promise<LightMyRequestResponse> =>
  server.inject({ method: 'GET', url: '/api/auth/check', cookies })

describe('auth routes', () => {
  test('Should let the first user sign up, which logs them in, and nobody after them', async () => {
    const { server, config } = await buildTestServer()
    const cookieName = config.auth!.cookieName

    const checkBeforeSignUpResponse = await checkAuthentication(server)

    expect(checkBeforeSignUpResponse.statusCode).toBe(401)
    expect(checkBeforeSignUpResponse.json()).toEqual({
      success: false,
      message: needsSignupMessage
    })

    const signUpResponse = await postCredentials(server, 'signup')
    const sessionCookie = signUpResponse.cookies.find(({ name }) => name === cookieName)

    expect(signUpResponse.statusCode).toBe(200)
    expect(signUpResponse.json()).toEqual({ success: true, message: 'Sign up successful.' })
    expect(sessionCookie).toMatchObject({ httpOnly: true, path: '/' })

    const checkAfterSignUpResponse = await checkAuthentication(server, {
      [cookieName]: sessionCookie!.value
    })

    expect(checkAfterSignUpResponse.statusCode).toBe(200)

    const secondSignUpResponse = await postCredentials(server, 'signup', {
      username: 'intruder',
      password: 'secret'
    })

    expect(secondSignUpResponse.statusCode).toBe(403)
    expect(secondSignUpResponse.json()).toEqual({ success: false, message: 'Unauthorized.' })
    expect(secondSignUpResponse.cookies).toEqual([])
  })

  test('Should log a user in with the credentials of the account only, and out', async () => {
    const { server, config } = await buildTestServer()
    const cookieName = config.auth!.cookieName
    await postCredentials(server, 'signup')

    const wrongPasswordResponse = await postCredentials(server, 'login', {
      ...credentials,
      password: 'guess'
    })

    expect(wrongPasswordResponse.statusCode).toBe(401)
    expect(wrongPasswordResponse.json()).toEqual({
      success: false,
      message: 'Invalid credentials.'
    })
    expect(wrongPasswordResponse.cookies).toEqual([])

    const loginResponse = await postCredentials(server, 'login')
    const sessionCookie = loginResponse.cookies.find(({ name }) => name === cookieName)

    expect(loginResponse.statusCode).toBe(200)
    expect(loginResponse.json()).toEqual({ success: true, message: 'Login successful.' })

    const loggedInCheckResponse = await checkAuthentication(server, {
      [cookieName]: sessionCookie!.value
    })
    const anonymousCheckResponse = await checkAuthentication(server)

    expect(loggedInCheckResponse.statusCode).toBe(200)
    expect(anonymousCheckResponse.statusCode).toBe(401)
    expect(anonymousCheckResponse.json()).toEqual({ success: false, message: 'Invalid token.' })

    const logoutResponse = await server.inject({ method: 'POST', url: '/api/auth/logout' })
    const clearedCookie = logoutResponse.cookies.find(({ name }) => name === cookieName)

    expect(logoutResponse.statusCode).toBe(200)
    expect(clearedCookie).toMatchObject({ value: '', expires: new Date(0) })
  })

  test('Should refuse credentials that are not a username and a password', async () => {
    const { server } = await buildTestServer()

    const signUpResponse = await postCredentials(server, 'signup', { username: 'admin' })
    expect(signUpResponse.statusCode).toBe(400)

    const loginResponse = await postCredentials(server, 'login', { password: 'secret' })
    expect(loginResponse.statusCode).toBe(400)

    expect((await checkAuthentication(server)).json()).toEqual({
      success: false,
      message: needsSignupMessage
    })
  })

  describe('Session cookie', () => {
    test('Should only be sent back over HTTPS when the user reached the server over HTTPS', async () => {
      const { server, config } = await buildTestServer({
        config: {
          auth: getMockAuthConfig({
            usersDbFilePath: IN_MEMORY_DATABASE_PATH,
            cookieSerializeOptions: createCookieSerializeOptions('/echo', 24 * 60 * 60)
          })
        }
      })
      const cookieName = config.auth!.cookieName

      const httpResponse = await postCredentials(server, 'signup')
      const httpsResponse = await postCredentials(server, 'login', credentials, {
        'x-forwarded-proto': 'https'
      })

      expect(httpResponse.cookies.find(({ name }) => name === cookieName)).toMatchObject({
        httpOnly: true,
        path: '/echo'
      })
      expect(httpResponse.cookies.find(({ name }) => name === cookieName)).not.toHaveProperty(
        'secure'
      )
      expect(httpsResponse.cookies.find(({ name }) => name === cookieName)).toMatchObject({
        secure: true
      })
    })
  })

  describe('Attempts limit', () => {
    const limitedAuthConfig = getMockAuthConfig({
      usersDbFilePath: IN_MEMORY_DATABASE_PATH,
      credentialsAttemptsLimit: { maxAttempts: 2, timeWindowMilliseconds: 60 * 1000 }
    })

    const sendThreeLoginsFromThreeForwardedAddresses = async (
      server: EchoServer
    ): Promise<number[]> => {
      const statusCodes: number[] = []

      for (const forwardedAddress of ['203.0.113.1', '203.0.113.2', '203.0.113.3']) {
        const response = await postCredentials(server, 'login', credentials, {
          'x-forwarded-for': forwardedAddress
        })
        statusCodes.push(response.statusCode)
      }

      return statusCodes
    }

    test('Should stop answering the address that sent too many credentials', async () => {
      const { server } = await buildTestServer({ config: { auth: limitedAuthConfig } })

      const statusCodes = await sendThreeLoginsFromThreeForwardedAddresses(server)

      expect(statusCodes).toEqual([401, 401, 429])
    })

    test('Should count the attempts per forwarded address once the proxies to believe are listed', async () => {
      const { server } = await buildTestServer({
        config: {
          auth: limitedAuthConfig,
          server: getMockServerConfig({ trustedProxies: ['127.0.0.1'] })
        }
      })

      const statusCodes = await sendThreeLoginsFromThreeForwardedAddresses(server)

      expect(statusCodes).toEqual([401, 401, 401])
    })
  })
})

import type { LightMyRequestResponse } from 'fastify'
import { describe, expect, test } from 'vitest'

import type { EchoServer } from '../../../../initializers/types/echoServer.js'
import { buildTestServer } from '../../../../test/buildTestServer.js'
import { IN_MEMORY_DATABASE_PATH } from '../../../../test/mocks/inMemoryDatabase.js'
import { getMockAuthConfig } from '../../../../test/mocks/mockConfigs.js'
import { getMockAuthSettings, getMockServerSettings } from '../../../../test/mocks/mockSettings.js'

const credentials = { username: 'admin', password: 'secret' }

const postCredentials = (
  server: EchoServer,
  route: 'signup' | 'login',
  payload: object = credentials,
  headers: Record<string, string> = {}
): Promise<LightMyRequestResponse> =>
  server.inject({ method: 'POST', url: `/api/auth/${route}`, payload, headers })

const getAuthStatus = (
  server: EchoServer,
  cookies: Record<string, string> = {}
): Promise<LightMyRequestResponse> =>
  server.inject({ method: 'GET', url: '/api/auth/status', cookies })

describe('auth routes', () => {
  test('Should let the first user sign up, which logs them in, and nobody after them', async () => {
    const { server, settings } = await buildTestServer()
    const cookieName = settings.auth!.config.cookieName

    const statusBeforeSignUpResponse = await getAuthStatus(server)

    expect(statusBeforeSignUpResponse.statusCode).toBe(200)
    expect(statusBeforeSignUpResponse.json()).toEqual({ status: 'needsSignUp' })

    const signUpResponse = await postCredentials(server, 'signup')
    const sessionCookie = signUpResponse.cookies.find(({ name }) => name === cookieName)

    expect(signUpResponse.statusCode).toBe(204)
    expect(signUpResponse.body).toBe('')
    expect(sessionCookie).toMatchObject({ httpOnly: true, path: '/' })

    const statusAfterSignUpResponse = await getAuthStatus(server, {
      [cookieName]: sessionCookie!.value
    })

    expect(statusAfterSignUpResponse.json()).toEqual({ status: 'authenticated' })

    const secondSignUpResponse = await postCredentials(server, 'signup', {
      username: 'intruder',
      password: 'secret'
    })

    expect(secondSignUpResponse.statusCode).toBe(403)
    expect(secondSignUpResponse.json()).toEqual({ statusCode: 403, message: 'Sign up refused.' })
    expect(secondSignUpResponse.cookies).toEqual([])
  })

  test('Should log a user in with the credentials of the account only, and out', async () => {
    const { server, settings } = await buildTestServer()
    const cookieName = settings.auth!.config.cookieName
    await postCredentials(server, 'signup')

    const wrongPasswordResponse = await postCredentials(server, 'login', {
      ...credentials,
      password: 'guess'
    })

    expect(wrongPasswordResponse.statusCode).toBe(401)
    expect(wrongPasswordResponse.json()).toEqual({
      statusCode: 401,
      message: 'Invalid credentials.'
    })
    expect(wrongPasswordResponse.cookies).toEqual([])

    const loginResponse = await postCredentials(server, 'login')
    const sessionCookie = loginResponse.cookies.find(({ name }) => name === cookieName)

    expect(loginResponse.statusCode).toBe(204)
    expect(loginResponse.body).toBe('')

    const loggedInStatusResponse = await getAuthStatus(server, {
      [cookieName]: sessionCookie!.value
    })
    const anonymousStatusResponse = await getAuthStatus(server)

    expect(loggedInStatusResponse.json()).toEqual({ status: 'authenticated' })
    expect(anonymousStatusResponse.statusCode).toBe(200)
    expect(anonymousStatusResponse.json()).toEqual({ status: 'unauthenticated' })

    const logoutResponse = await server.inject({ method: 'POST', url: '/api/auth/logout' })
    const clearedCookie = logoutResponse.cookies.find(({ name }) => name === cookieName)

    expect(logoutResponse.statusCode).toBe(204)
    expect(clearedCookie).toMatchObject({ value: '', expires: new Date(0) })
  })

  test('Should refuse credentials that are not a username and a password', async () => {
    const { server } = await buildTestServer()

    const signUpResponse = await postCredentials(server, 'signup', { username: 'admin' })
    expect(signUpResponse.statusCode).toBe(400)

    const loginResponse = await postCredentials(server, 'login', { password: 'secret' })
    expect(loginResponse.statusCode).toBe(400)

    expect((await getAuthStatus(server)).json()).toEqual({ status: 'needsSignUp' })
  })

  describe('Session cookie', () => {
    test('Should only be sent back over HTTPS when the user reached the server over HTTPS', async () => {
      const { server, settings } = await buildTestServer({
        settings: {
          auth: getMockAuthSettings({
            config: getMockAuthConfig({
              cookieSerializeOptions: { path: '/echo', secure: 'auto', httpOnly: true }
            }),
            usersDbFilePath: IN_MEMORY_DATABASE_PATH
          })
        }
      })
      const cookieName = settings.auth!.config.cookieName

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
    const limitedAuthSettings = getMockAuthSettings({
      config: getMockAuthConfig({
        credentialsAttemptsLimit: { maxAttempts: 2, timeWindowMilliseconds: 60 * 1000 }
      }),
      usersDbFilePath: IN_MEMORY_DATABASE_PATH
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
      const { server } = await buildTestServer({ settings: { auth: limitedAuthSettings } })

      const statusCodes = await sendThreeLoginsFromThreeForwardedAddresses(server)

      expect(statusCodes).toEqual([401, 401, 429])
    })

    test('Should count the attempts per forwarded address once the proxies to believe are listed', async () => {
      const { server } = await buildTestServer({
        settings: {
          auth: limitedAuthSettings,
          server: getMockServerSettings({ trustedProxies: ['127.0.0.1'] })
        }
      })

      const statusCodes = await sendThreeLoginsFromThreeForwardedAddresses(server)

      expect(statusCodes).toEqual([401, 401, 401])
    })
  })
})

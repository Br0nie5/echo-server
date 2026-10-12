import Database from 'better-sqlite3'
import Fastify, { type FastifyInstance, type LightMyRequestResponse } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../modules/auth/infra/users.db.js')

import { createUsersDb as actualCreateUsersDb } from '../../modules/auth/infra/users.db.js'
import { EchoErrorJsonSchema } from '../../shared/schemas/errors.schemas.js'
import {
  getMockAuthConfig,
  getMockBackConfig,
  getMockServerConfig
} from '../../test/mocks/mockConfigs.js'
import { getMockFilesService } from '../../test/mocks/mockFilesService.js'
import { registerAuthRoutes } from '../registerAuthRoutes.js'

const createUsersDb = vi.mocked(actualCreateUsersDb)
/** The table `createUsersDb` creates, which the routes query. */
const USERS_TABLE =
  'CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, ' +
  'password_hash TEXT NOT NULL, is_admin INTEGER NOT NULL DEFAULT 0)'
const filesService = getMockFilesService()

describe('registerAuthRoutes', () => {
  let server: FastifyInstance
  let usersDb: Database.Database

  beforeEach(() => {
    vi.clearAllMocks()
    usersDb = new Database(':memory:')
    createUsersDb.mockResolvedValue(usersDb)
    server = Fastify()
    server.addSchema(EchoErrorJsonSchema)
  })

  afterEach(async () => {
    await server.close()
    usersDb.close()
  })

  it('Should register the routes under the API prefix, on top of the users database', async () => {
    const authConfig = getMockAuthConfig()

    await registerAuthRoutes(
      server,
      getMockBackConfig({
        server: getMockServerConfig({ apiRoutePrefix: '/custom-api' }),
        auth: authConfig
      }),
      filesService
    )
    await server.ready()

    expect(createUsersDb).toHaveBeenCalledWith(authConfig, filesService)
    expect(server.hasRoute({ method: 'POST', url: '/custom-api/auth/login' })).toBe(true)
    expect(server.hasRoute({ method: 'GET', url: '/custom-api/auth/check' })).toBe(true)
  })

  it('Should answer a 429 once the login attempts of an address reach the limit', async () => {
    await registerAuthRoutes(
      server,
      getMockBackConfig({
        auth: getMockAuthConfig({
          credentialsAttemptsLimit: { maxAttempts: 2, timeWindowMilliseconds: 60 * 1000 }
        })
      }),
      filesService
    )
    usersDb.exec(USERS_TABLE)
    const login = (): Promise<LightMyRequestResponse> =>
      server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { username: 'ghost', password: 'wrong password' }
      })

    const statusCodes = [(await login()).statusCode, (await login()).statusCode]
    const limitedResponse = await login()

    expect(statusCodes).toEqual([401, 401])
    expect(limitedResponse.statusCode).toBe(429)
    expect(limitedResponse.json()).toMatchObject({ statusCode: 429 })
  })

  describe('behind a reverse proxy', () => {
    /** Sends a failing login per address of `clientAddresses`, each forwarded by a proxy trusted as `trustedProxies` says, and gives the status codes. */
    const loginFromClients = async (
      trustedProxies: string[] | undefined,
      clientAddresses: string[]
    ): Promise<number[]> => {
      await server.close()
      server = Fastify({ trustProxy: trustedProxies ?? true })
      server.addSchema(EchoErrorJsonSchema)
      await registerAuthRoutes(
        server,
        getMockBackConfig({
          server: getMockServerConfig({ trustedProxies }),
          auth: getMockAuthConfig({
            credentialsAttemptsLimit: { maxAttempts: 1, timeWindowMilliseconds: 60 * 1000 }
          })
        }),
        filesService
      )
      usersDb.exec(USERS_TABLE)

      const statusCodes: number[] = []
      for (const clientAddress of clientAddresses) {
        const response = await server.inject({
          method: 'POST',
          url: '/api/auth/login',
          headers: { 'x-forwarded-for': clientAddress },
          payload: { username: 'ghost', password: 'wrong password' }
        })
        statusCodes.push(response.statusCode)
      }
      return statusCodes
    }

    it('Should limit the login attempts per client address when the proxy is a known one', async () => {
      expect(await loginFromClients(['127.0.0.1'], ['10.0.0.1', '10.0.0.2', '10.0.0.1'])).toEqual([
        401, 401, 429
      ])
    })

    it('Should not let a client escape the limit by naming another address when any proxy is trusted', async () => {
      expect(await loginFromClients(undefined, ['10.0.0.1', '10.0.0.2'])).toEqual([401, 429])
    })
  })

  it('Should not limit the routes receiving no credentials', async () => {
    await registerAuthRoutes(
      server,
      getMockBackConfig({
        auth: getMockAuthConfig({
          credentialsAttemptsLimit: { maxAttempts: 1, timeWindowMilliseconds: 60 * 1000 }
        })
      }),
      filesService
    )

    usersDb.exec(USERS_TABLE)

    await server.inject({ method: 'GET', url: '/api/auth/check' })
    const response = await server.inject({ method: 'GET', url: '/api/auth/check' })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({ success: false })
  })

  it('Should register no route and open no database when authentication is disabled', async () => {
    await registerAuthRoutes(server, getMockBackConfig({ auth: undefined }), filesService)
    await server.ready()

    expect(createUsersDb).not.toHaveBeenCalled()
    expect(server.hasRoute({ method: 'POST', url: '/api/auth/login' })).toBe(false)
  })
})

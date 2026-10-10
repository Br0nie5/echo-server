import Database from 'better-sqlite3'
import Fastify, { type FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../modules/auth/infra/users.db.js')

import { createUsersDb as actualCreateUsersDb } from '../../modules/auth/infra/users.db.js'
import { EchoErrorJsonSchema } from '../../shared/schemas/errors.schemas.js'
import {
  getMockAuthConfig,
  getMockBackConfig,
  getMockServerConfig
} from '../../test/mocks/configs.js'
import { getMockFilesService } from '../../test/mocks/filesService.js'
import { registerAuthRoutes } from '../registerAuthRoutes.js'

const createUsersDb = vi.mocked(actualCreateUsersDb)
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

  it('should register the routes under the API prefix, on top of the users database', async () => {
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

  it('should register no route and open no database when authentication is disabled', async () => {
    await registerAuthRoutes(server, getMockBackConfig({ auth: undefined }), filesService)
    await server.ready()

    expect(createUsersDb).not.toHaveBeenCalled()
    expect(server.hasRoute({ method: 'POST', url: '/api/auth/login' })).toBe(false)
  })
})

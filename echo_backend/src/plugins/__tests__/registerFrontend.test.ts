import path from 'path'
import { fileURLToPath } from 'url'

import Fastify, { type FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getMockServerConfig } from '../../test/mocks/configs.js'
import { registerFrontend } from '../registerFrontend.js'

const FRONTEND_DIST_DIR_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'frontendDist'
)

describe('registerFrontend', () => {
  let server: FastifyInstance

  beforeEach(async () => {
    server = Fastify()
    await registerFrontend(
      server,
      getMockServerConfig({ frontendDistDirPath: FRONTEND_DIST_DIR_PATH, appRoutePrefix: '/app' })
    )
  })

  afterEach(async () => {
    await server.close()
  })

  it('should serve the files of the frontend under the app prefix', async () => {
    const response = await server.inject({ method: 'GET', url: '/app/asset.txt' })

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe('asset content\n')
  })

  it('should answer index.html to an unknown path under the app prefix', async () => {
    const response = await server.inject({ method: 'GET', url: '/app/logs/unknown' })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.body).toContain('Echo test app')
  })

  it('should answer a JSON 404 to an unknown path outside the app prefix', async () => {
    const response = await server.inject({ method: 'GET', url: '/unknown' })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ error: 'Not found' })
  })
})

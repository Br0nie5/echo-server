import path from 'path'
import { fileURLToPath } from 'url'

import Fastify, { type FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getMockServerConfig } from '../../test/mocks/mockConfigs.js'
import { getMockFilesService } from '../../test/mocks/mockFilesService.js'
import { registerFrontend } from '../registerFrontend.js'

// @fastify/static reads the files it serves from the disk itself, with no file system to inject:
// they are fixtures committed next to the test. Its index.html must never be answered as it is.
const FRONTEND_DIST_DIR_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'frontendDist'
)
const INDEX_HTML = '<!doctype html><html><head><title>Echo test app</title></head></html>'

describe('registerFrontend', () => {
  let server: FastifyInstance
  const filesService = getMockFilesService()

  const startServer = async (basePath: string): Promise<void> => {
    server = Fastify()
    await registerFrontend(
      server,
      getMockServerConfig({
        frontendDistDirPath: FRONTEND_DIST_DIR_PATH,
        basePath,
        appRoutePrefix: '/app'
      }),
      filesService
    )
  }

  beforeEach(async () => {
    filesService.getFileContent.mockResolvedValue(INDEX_HTML)
    await startServer('')
  })

  afterEach(async () => {
    await server.close()
  })

  it('Should serve the files of the frontend under the app prefix', async () => {
    const response = await server.inject({ method: 'GET', url: '/app/asset.txt' })

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe('asset content\n')
  })

  it.each(['/app', '/app/', '/app/index.html', '/app/logs/unknown', '/app/unknown?tab=logs'])(
    'Should answer index.html, with the base of the app, to %s',
    async (url) => {
      const response = await server.inject({ method: 'GET', url })

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toBe('text/html; charset=utf-8')
      expect(response.body).toBe(
        '<!doctype html><html><head><base href="/app/"><title>Echo test app</title></head></html>'
      )
      expect(filesService.getFileContent).toHaveBeenCalledExactlyOnceWith(
        path.join(FRONTEND_DIST_DIR_PATH, 'index.html')
      )
    }
  )

  it('Should give index.html the base path the reverse proxy serves Echo under', async () => {
    await server.close()
    await startServer('/tools/echo')

    const response = await server.inject({ method: 'GET', url: '/app/logs' })

    expect(response.body).toContain('<head><base href="/tools/echo/app/">')
  })

  it.each(['/application', '/app-old/logs', '/apple?next=/app/'])(
    'Should answer a 404 EchoError to %s, which only starts like the app prefix',
    async (url) => {
      const response = await server.inject({ method: 'GET', url })

      expect(response.statusCode).toBe(404)
      expect(response.json()).toEqual({ statusCode: 404, message: 'Not found.' })
    }
  )

  it('Should answer a 404 EchoError to an unknown path outside the app prefix', async () => {
    const response = await server.inject({ method: 'GET', url: '/unknown' })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ statusCode: 404, message: 'Not found.' })
  })
})

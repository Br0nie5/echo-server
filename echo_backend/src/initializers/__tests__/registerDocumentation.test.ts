import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger'
import Fastify, { type FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockServerConfig } from '../../test/mocks/mockConfigs.js'
import { registerDocumentation } from '../registerDocumentation.js'

describe('registerDocumentation', () => {
  let server: FastifyInstance

  beforeEach(() => {
    server = Fastify()
  })

  afterEach(async () => {
    await server.close()
  })

  it('Should describe the API as served below the server URL, base path included', async () => {
    await registerDocumentation(
      server,
      getMockServerConfig({ serverUrl: 'https://allowed-domain.com:3700/echo/', basePath: '/echo' })
    )
    await server.ready()

    const openApi = server.swagger() as {
      info: { title: string }
      servers: Array<{ url: string }>
      tags: Array<{ name: string }>
    }

    expect(openApi.info.title).toBe('Echo API')
    expect(openApi.servers).toEqual([{ url: 'https://allowed-domain.com:3700/echo' }])
    expect(openApi.tags.map((tag) => tag.name)).toEqual(['Logs', 'Authentication'])
  })

  it('Should serve the OpenAPI document and its UI under /documentation', async () => {
    await registerDocumentation(server, getMockServerConfig())

    const jsonResponse = await server.inject({ method: 'GET', url: '/documentation/json' })
    const uiResponse = await server.inject({ method: 'GET', url: '/documentation/' })

    expect(jsonResponse.statusCode).toBe(200)
    expect(jsonResponse.json().info.title).toBe('Echo API')
    expect(uiResponse.statusCode).toBe(200)
    expect(uiResponse.headers['content-type']).toContain('text/html')
  })

  it('Should make the UI load its files below the base path', async () => {
    await registerDocumentation(server, getMockServerConfig({ basePath: '/tools/echo' }))

    const uiResponse = await server.inject({ method: 'GET', url: '/documentation' })

    expect(uiResponse.body).toContain('src="/tools/echo/documentation/static/swagger-ui-bundle.js"')
  })

  it('Should name a shared schema after its $id', async () => {
    await registerDocumentation(server, getMockServerConfig())
    server.addSchema({ $id: 'Thing', type: 'object', properties: { name: { type: 'string' } } })
    server.get('/things', { schema: { response: { 200: { $ref: 'Thing#' } } } }, async () => ({}))
    await server.ready()

    const openApi = server.swagger() as { components: { schemas: Record<string, unknown> } }

    expect(Object.keys(openApi.components.schemas)).toEqual(['Thing'])
  })

  it('Should name a schema without $id after its position', async () => {
    const register = vi.spyOn(server, 'register')
    await registerDocumentation(server, getMockServerConfig())

    const swaggerOptions = register.mock.calls[0][1] as FastifyDynamicSwaggerOptions
    const buildLocalReference = swaggerOptions.refResolver?.buildLocalReference as (
      json: { $id?: string },
      baseUri: unknown,
      fragment: string,
      position: number
    ) => string

    expect(buildLocalReference({}, {}, '', 3)).toBe('def-3')
  })
})

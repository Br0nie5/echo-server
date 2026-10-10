import { describe, it, expect } from 'vitest'

import { parseBasePath } from '../parseBasePath.js'

const ROUTE_PREFIXES = ['/api', '/app', '/documentation']

describe('parseBasePath', () => {
  it('Should return an empty path when the server URL is at the root of its origin', () => {
    expect(parseBasePath('https://domain.com', ROUTE_PREFIXES)).toBe('')
    expect(parseBasePath('https://domain.com/', ROUTE_PREFIXES)).toBe('')
  })

  it('Should return the path of the server URL, without its trailing slashes', () => {
    expect(parseBasePath('https://domain.com/echo', ROUTE_PREFIXES)).toBe('/echo')
    expect(parseBasePath('https://domain.com:3700/tools/echo//', ROUTE_PREFIXES)).toBe(
      '/tools/echo'
    )
  })

  it('Should accept a path that only starts like a route prefix', () => {
    expect(parseBasePath('https://domain.com/application', ROUTE_PREFIXES)).toBe('/application')
    expect(parseBasePath('https://domain.com/echo/api', ROUTE_PREFIXES)).toBe('/echo/api')
  })

  it.each([
    ['https://domain.com/api', '/api'],
    ['https://domain.com/app/echo', '/app'],
    ['https://domain.com/documentation/', '/documentation']
  ])('Should throw when the path of %s starts with %s', (serverUrl, routePrefix) => {
    expect(() => parseBasePath(serverUrl, ROUTE_PREFIXES)).toThrow(
      `Invalid SERVER_URL: ${serverUrl}, its path cannot start with ${routePrefix}, ` +
        'which Echo serves itself'
    )
  })

  it('Should throw a TypeError when the server URL is not a valid URL', () => {
    expect(() => parseBasePath('not-a-url', ROUTE_PREFIXES)).toThrow(TypeError)
  })
})

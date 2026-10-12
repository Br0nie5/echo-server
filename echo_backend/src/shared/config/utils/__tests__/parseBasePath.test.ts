import { describe, it, expect } from 'vitest'

import { parseBasePath } from '../parseBasePath.js'

const ROUTE_PREFIXES = ['/api', '/app', '/documentation']

describe('parseBasePath', () => {
  it.each([undefined, '', '/', '//'])(
    'Should return an empty path when the base path is %o',
    (raw) => {
      expect(parseBasePath(raw, ROUTE_PREFIXES)).toBe('')
    }
  )

  it('Should return the base path, without its trailing slashes', () => {
    expect(parseBasePath('/echo', ROUTE_PREFIXES)).toBe('/echo')
    expect(parseBasePath('/tools/echo_2.0//', ROUTE_PREFIXES)).toBe('/tools/echo_2.0')
  })

  it('Should accept a path that only starts like a route prefix', () => {
    expect(parseBasePath('/application', ROUTE_PREFIXES)).toBe('/application')
    expect(parseBasePath('/echo/api', ROUTE_PREFIXES)).toBe('/echo/api')
  })

  it.each([
    ['/api', '/api'],
    ['/app/echo', '/app'],
    ['/documentation/', '/documentation']
  ])('Should throw when the base path %s starts with %s', (raw, routePrefix) => {
    expect(() => parseBasePath(raw, ROUTE_PREFIXES)).toThrow(
      `Invalid BASE_PATH: ${raw}, it cannot start with ${routePrefix}, which Echo serves itself`
    )
  })

  it.each(['echo', 'https://domain.com/echo', '/tools//echo', '/echo?page=1', '/"><script>'])(
    'Should throw when the base path is not a path: %s',
    (raw) => {
      expect(() => parseBasePath(raw, ROUTE_PREFIXES)).toThrow(
        `Invalid BASE_PATH: ${raw}, it must be a path like /echo or /tools/echo`
      )
    }
  )
})

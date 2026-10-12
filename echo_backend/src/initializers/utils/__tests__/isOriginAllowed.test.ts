import { describe, expect, it } from 'vitest'

import { isOriginAllowed } from '../isOriginAllowed.js'

describe('isOriginAllowed', () => {
  it.each([
    ['https://echo.example.com', 'echo.example.com'],
    ['http://192.168.1.1:4000', '192.168.1.1:4000'],
    ['http://[::1]:4000', '[::1]:4000']
  ])('Should allow the origin %s of a request sent to %s', (origin, requestHost) => {
    expect(isOriginAllowed(origin, requestHost)).toBe(true)
  })

  it.each([
    ['another domain', 'https://evil.com'],
    ['a subdomain of the host', 'https://logs.echo.example.com'],
    ['a domain that merely ends with the host', 'https://badecho.example.com'],
    ['the host on another port', 'https://echo.example.com:5000']
  ])('Should refuse %s', (_description, origin) => {
    expect(isOriginAllowed(origin, 'echo.example.com')).toBe(false)
  })

  it('Should throw on an invalid origin', () => {
    expect(() => isOriginAllowed('not a url', 'echo.example.com')).toThrow(TypeError)
  })
})

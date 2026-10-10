import { describe, it, expect } from 'vitest'

import { parseCookieSerializeOptions } from '../parseCookieSerializeOptions.js'

describe('parseCookieSerializeOptions', () => {
  it('should bind the cookie to the allowed domain', () => {
    expect(
      parseCookieSerializeOptions('allowed-domain.com', 'https://logs.allowed-domain.com', 86400)
    ).toStrictEqual({
      domain: 'allowed-domain.com',
      httpOnly: true,
      maxAge: 86400,
      path: '/',
      sameSite: 'lax',
      secure: true
    })
  })

  it.each(['localhost', '192.168.1.1', '[::1]'])(
    'should not bind the cookie to a domain if the allowed domain is %s',
    (allowedDomain) => {
      expect(
        parseCookieSerializeOptions(allowedDomain, `https://${allowedDomain}`, 86400)
      ).toStrictEqual({
        domain: undefined,
        httpOnly: true,
        maxAge: 86400,
        path: '/',
        sameSite: 'lax',
        secure: true
      })
    }
  )

  it('should make the cookie last the session duration', () => {
    expect(parseCookieSerializeOptions('localhost', 'http://localhost', 3600).maxAge).toBe(3600)
  })

  it.each([
    ['http://localhost:5173', 'localhost', false],
    ['http://mylocalhost.com', 'mylocalhost.com', false],
    ['http://192.168.1.1:4000', '192.168.1.1', false],
    ['https://localhost:4000', 'localhost', true],
    ['https://mylocalhost.com', 'mylocalhost.com', true],
    ['https://192.168.1.1:4000', '192.168.1.1', true]
  ])('should make the cookie secure only over HTTPS: %s', (serverUrl, allowedDomain, secure) => {
    expect(parseCookieSerializeOptions(allowedDomain, serverUrl, 86400).secure).toBe(secure)
  })
})

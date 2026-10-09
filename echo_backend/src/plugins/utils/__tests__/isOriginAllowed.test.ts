import { describe, expect, it } from 'vitest'

import { isOriginAllowed } from '../isOriginAllowed.js'

const requestHost = 'echo.example.com'

describe('isOriginAllowed', () => {
  it('should allow the exact domain', () => {
    expect(
      isOriginAllowed('https://echo.example.com', {
        allowedDomain: 'echo.example.com',
        requestHost
      })
    ).toBe(true)
  })

  it('should allow a subdomain of the allowed domain', () => {
    expect(
      isOriginAllowed('https://app.example.com', { allowedDomain: 'example.com', requestHost })
    ).toBe(true)
  })

  it('should refuse a different domain', () => {
    expect(isOriginAllowed('https://evil.com', { allowedDomain: 'example.com', requestHost })).toBe(
      false
    )
  })

  it('should refuse a domain that merely ends with the allowed one', () => {
    expect(
      isOriginAllowed('https://badexample.com', { allowedDomain: 'example.com', requestHost })
    ).toBe(false)
  })

  it('should allow the origin the request is sent to, whatever the allowed domain', () => {
    expect(
      isOriginAllowed('http://192.168.1.1:4000', {
        allowedDomain: 'localhost',
        requestHost: '192.168.1.1:4000'
      })
    ).toBe(true)
  })

  it('should refuse the host the request is sent to on another port', () => {
    expect(
      isOriginAllowed('http://192.168.1.1:5000', {
        allowedDomain: 'localhost',
        requestHost: '192.168.1.1:4000'
      })
    ).toBe(false)
  })

  describe('when the allowed domain is localhost', () => {
    const allowedOrigins = { allowedDomain: 'localhost', requestHost: 'localhost:4000' }

    it.each(['http://localhost:5173', 'http://127.0.0.1:5173', 'http://[::1]:5173'])(
      'should allow the loopback origin %s, on any port',
      (origin) => {
        expect(isOriginAllowed(origin, allowedOrigins)).toBe(true)
      }
    )

    it('should refuse any other origin', () => {
      expect(isOriginAllowed('https://evil.com', allowedOrigins)).toBe(false)
    })
  })

  describe('when the allowed domain is an IP address', () => {
    const allowedOrigins = { allowedDomain: '192.168.1.1', requestHost: 'echo.internal' }

    it('should allow that address, on any port', () => {
      expect(isOriginAllowed('http://192.168.1.1:5173', allowedOrigins)).toBe(true)
    })

    it('should refuse any other origin, loopback addresses included', () => {
      expect(isOriginAllowed('https://evil.com', allowedOrigins)).toBe(false)
      expect(isOriginAllowed('http://127.0.0.1:4000', allowedOrigins)).toBe(false)
    })

    it('should refuse a name that ends with the address', () => {
      expect(isOriginAllowed('http://evil.192.168.1.1.example', allowedOrigins)).toBe(false)
      expect(
        isOriginAllowed('http://a.b', { allowedDomain: '[::1]', requestHost: 'echo.internal' })
      ).toBe(false)
    })
  })

  it('should throw on an invalid origin', () => {
    expect(() =>
      isOriginAllowed('not a url', { allowedDomain: 'example.com', requestHost })
    ).toThrow(TypeError)
  })
})

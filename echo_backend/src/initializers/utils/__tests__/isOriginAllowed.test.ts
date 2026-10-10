import { describe, expect, it } from 'vitest'

import { isOriginAllowed } from '../isOriginAllowed.js'

const requestHost = 'echo.example.com'

describe('isOriginAllowed', () => {
  it('Should allow the exact domain', () => {
    expect(
      isOriginAllowed('https://echo.example.com', {
        allowedDomain: 'echo.example.com',
        requestHost
      })
    ).toBe(true)
  })

  it('Should allow a subdomain of the allowed domain', () => {
    expect(
      isOriginAllowed('https://app.example.com', { allowedDomain: 'example.com', requestHost })
    ).toBe(true)
  })

  it('Should refuse a different domain', () => {
    expect(isOriginAllowed('https://evil.com', { allowedDomain: 'example.com', requestHost })).toBe(
      false
    )
  })

  it('Should refuse a domain that merely ends with the allowed one', () => {
    expect(
      isOriginAllowed('https://badexample.com', { allowedDomain: 'example.com', requestHost })
    ).toBe(false)
  })

  it('Should allow the origin the request is sent to, whatever the allowed domain', () => {
    expect(
      isOriginAllowed('http://192.168.1.1:4000', {
        allowedDomain: 'localhost',
        requestHost: '192.168.1.1:4000'
      })
    ).toBe(true)
  })

  it('Should refuse the host the request is sent to on another port', () => {
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
      'Should allow the loopback origin %s, on any port',
      (origin) => {
        expect(isOriginAllowed(origin, allowedOrigins)).toBe(true)
      }
    )

    it('Should refuse any other origin', () => {
      expect(isOriginAllowed('https://evil.com', allowedOrigins)).toBe(false)
    })
  })

  describe('when the allowed domain is an IP address', () => {
    const allowedOrigins = { allowedDomain: '192.168.1.1', requestHost: 'echo.internal' }

    it('Should allow that address, on any port', () => {
      expect(isOriginAllowed('http://192.168.1.1:5173', allowedOrigins)).toBe(true)
    })

    it('Should refuse any other origin, loopback addresses included', () => {
      expect(isOriginAllowed('https://evil.com', allowedOrigins)).toBe(false)
      expect(isOriginAllowed('http://127.0.0.1:4000', allowedOrigins)).toBe(false)
    })

    it('Should refuse a name that ends with the address', () => {
      expect(isOriginAllowed('http://evil.192.168.1.1.example', allowedOrigins)).toBe(false)
      expect(
        isOriginAllowed('http://a.b', { allowedDomain: '[::1]', requestHost: 'echo.internal' })
      ).toBe(false)
    })
  })

  it('Should throw on an invalid origin', () => {
    expect(() =>
      isOriginAllowed('not a url', { allowedDomain: 'example.com', requestHost })
    ).toThrow(TypeError)
  })
})

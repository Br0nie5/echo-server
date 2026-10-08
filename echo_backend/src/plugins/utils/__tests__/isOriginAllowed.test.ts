import { describe, expect, it } from 'vitest'

import { isOriginAllowed } from '../isOriginAllowed.js'

describe('isOriginAllowed', () => {
  it('should allow any origin when the allowed domain is localhost', () => {
    expect(isOriginAllowed('https://evil.com', 'localhost')).toBe(true)
  })

  it('should allow the exact domain', () => {
    expect(isOriginAllowed('https://echo.example.com', 'echo.example.com')).toBe(true)
  })

  it('should allow a subdomain of the allowed domain', () => {
    expect(isOriginAllowed('https://app.example.com', 'example.com')).toBe(true)
  })

  it('should refuse a different domain', () => {
    expect(isOriginAllowed('https://evil.com', 'example.com')).toBe(false)
  })

  it('should refuse a domain that merely ends with the allowed one', () => {
    expect(isOriginAllowed('https://badexample.com', 'example.com')).toBe(false)
  })

  it('should throw on an invalid origin', () => {
    expect(() => isOriginAllowed('not a url', 'example.com')).toThrow()
  })
})

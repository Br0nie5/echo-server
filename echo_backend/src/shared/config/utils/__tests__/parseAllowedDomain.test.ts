import { describe, it, expect } from 'vitest'

import { parseAllowedDomain } from '../parseAllowedDomain.js'

describe('parseAllowedDomain', () => {
  it('should return the domain of the server URL, whatever its protocol, port and path', () => {
    expect(parseAllowedDomain('http://domain.com')).toBe('domain.com')
    expect(parseAllowedDomain('http://domain.com:3700')).toBe('domain.com')
    expect(parseAllowedDomain('https://domain.com')).toBe('domain.com')
    expect(parseAllowedDomain('https://domain.com/some/path/name')).toBe('domain.com')
  })

  it('should keep a suffix made of several parts', () => {
    expect(parseAllowedDomain('https://domain.co.uk')).toBe('domain.co.uk')
    expect(parseAllowedDomain('https://domain.co.uk:3700/some/path/name')).toBe('domain.co.uk')
  })

  it('should leave the subdomains out', () => {
    expect(parseAllowedDomain('https://subdomain.domain.com')).toBe('domain.com')
    expect(parseAllowedDomain('https://deep.subdomain.domain.co.uk')).toBe('domain.co.uk')
  })

  it('should return the host when it has no registrable domain', () => {
    expect(parseAllowedDomain('http://localhost')).toBe('localhost')
    expect(parseAllowedDomain('http://localhost:5173')).toBe('localhost')
    expect(parseAllowedDomain('http://my-server:4000')).toBe('my-server')
  })

  it('should return localhost when the host of the server URL is an IP address', () => {
    expect(parseAllowedDomain('http://192.168.1.1')).toBe('localhost')
    expect(parseAllowedDomain('https://192.168.1.1:3700/some/path/name')).toBe('localhost')
  })

  it('should throw when the server URL is not a valid URL', () => {
    expect(() => parseAllowedDomain('not a valid url')).toThrow(TypeError)
  })
})

import { describe, it, expect } from 'vitest'

import { parseAllowedDomain } from '../parseAllowedDomain.js'

describe('parseAllowedDomain', () => {
  it('Should return the domain of the server URL, whatever its protocol, port and path', () => {
    expect(parseAllowedDomain('http://domain.com')).toBe('domain.com')
    expect(parseAllowedDomain('http://domain.com:3700')).toBe('domain.com')
    expect(parseAllowedDomain('https://domain.com')).toBe('domain.com')
    expect(parseAllowedDomain('https://domain.com/some/path/name')).toBe('domain.com')
  })

  it('Should keep a suffix made of several parts', () => {
    expect(parseAllowedDomain('https://domain.co.uk')).toBe('domain.co.uk')
    expect(parseAllowedDomain('https://domain.co.uk:3700/some/path/name')).toBe('domain.co.uk')
  })

  it('Should leave the subdomains out', () => {
    expect(parseAllowedDomain('https://subdomain.domain.com')).toBe('domain.com')
    expect(parseAllowedDomain('https://deep.subdomain.domain.co.uk')).toBe('domain.co.uk')
  })

  it('Should return the host when it has no registrable domain', () => {
    expect(parseAllowedDomain('http://localhost')).toBe('localhost')
    expect(parseAllowedDomain('http://localhost:5173')).toBe('localhost')
    expect(parseAllowedDomain('http://my-server:4000')).toBe('my-server')
  })

  it('Should return the IP address when the host of the server URL is one', () => {
    expect(parseAllowedDomain('http://192.168.1.1')).toBe('192.168.1.1')
    expect(parseAllowedDomain('https://192.168.1.1:3700/some/path/name')).toBe('192.168.1.1')
    expect(parseAllowedDomain('http://[::1]:4000')).toBe('[::1]')
  })

  it('Should throw when the server URL is not a valid URL', () => {
    expect(() => parseAllowedDomain('not a valid url')).toThrow(TypeError)
  })
})

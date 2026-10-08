import { describe, it, expect } from 'vitest'

import { parseAllowedDomain } from '../parseAllowedDomain.js'

describe('parseAllowedDomain', () => {
  it('should return the domain of the server URL', () => {
    expect(parseAllowedDomain('http://allowed-domain.com:3700')).toBe('allowed-domain.com')
  })

  it('should return localhost when the server URL is on localhost', () => {
    expect(parseAllowedDomain('http://localhost:5173')).toBe('localhost')
  })

  it('should return localhost when the host of the server URL is an IP address', () => {
    expect(parseAllowedDomain('http://192.168.1.1')).toBe('localhost')
  })
})

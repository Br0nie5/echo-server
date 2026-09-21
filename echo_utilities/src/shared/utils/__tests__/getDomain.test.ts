import { describe, it, expect } from 'vitest'

import { getDomain } from '../getDomain'

describe('getDomain', () => {
  describe('Simple urls', () => {
    it('should return the correct domain for each url', () => {
      expect(getDomain('http://domain.com')).toBe('domain.com')
      expect(getDomain('http://domain.com:3000')).toBe('domain.com')
      expect(getDomain('https://domain.com')).toBe('domain.com')
      expect(getDomain('https://domain.com/some/path/name')).toBe('domain.com')
    })
  })

  describe('Urls with complexe endings', () => {
    it('should return the correct domain for each url', () => {
      expect(getDomain('http://domain.co.uk')).toBe('domain.co.uk')
      expect(getDomain('http://domain.co.uk:3000')).toBe('domain.co.uk')
      expect(getDomain('https://domain.co.uk')).toBe('domain.co.uk')
      expect(getDomain('https://domain.co.uk/some/path/name')).toBe('domain.co.uk')
    })
  })

  describe('Urls with subdomain', () => {
    it('should return the correct domain for each url', () => {
      expect(getDomain('http://subdomain.domain.com')).toBe('domain.com')
      expect(getDomain('http://subdomain.domain.com:3000')).toBe('domain.com')
      expect(getDomain('https://subdomain.domain.com')).toBe('domain.com')
      expect(getDomain('https://subdomain.domain.com/some/path/name')).toBe('domain.com')
    })
  })

  describe('Must handle localhost', () => {
    it('should return the correct domain for each url', () => {
      expect(getDomain('http://localhost')).toBe('localhost')
      expect(getDomain('http://localhost:3000')).toBe('localhost')
      expect(getDomain('https://localhost')).toBe('localhost')
      expect(getDomain('https://localhost/some/path/name')).toBe('localhost')
    })
  })

  describe('Must handle custom IP', () => {
    it('should return the correct domain for each url', () => {
      expect(getDomain('http://192.168.1.10')).toBe('192.168.1.10')
      expect(getDomain('http://192.168.1.10:3000')).toBe('192.168.1.10')
      expect(getDomain('https://192.168.1.10')).toBe('192.168.1.10')
      expect(getDomain('https://192.168.1.10/some/path/name')).toBe('192.168.1.10')
    })
  })

  it('should return undefined if the url string is not a valid url', () => {
    expect(getDomain('Some randoms string')).toBeUndefined()
  })
})

import { describe, it, expect } from 'vitest'

import { getCleanUrlPathname } from '../getCleanUrlPathname'

describe('getCleanUrlPathname', () => {
  it('should return an empty string if the url does not have a pathname', () => {
    expect(getCleanUrlPathname(new URL('http://domain.com'))).toBe('')
  })

  it('should return the pathname if the url has one', () => {
    expect(getCleanUrlPathname(new URL('http://domain.com/some/path'))).toBe('/some/path')
  })

  it('should remove the trailing slash at the end of the pathname', () => {
    expect(getCleanUrlPathname(new URL('http://domain.com/some/path/'))).toBe('/some/path')
    expect(getCleanUrlPathname(new URL('http://domain.com/'))).toBe('')
  })

  it('should clean the pathname ending if there is multiples consecutive trailing slash', () => {
    expect(getCleanUrlPathname(new URL('http://domain.com/some/path///'))).toBe('/some/path')
  })
})

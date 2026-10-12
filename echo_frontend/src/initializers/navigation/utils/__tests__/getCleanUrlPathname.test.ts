import { describe, it, expect } from 'vitest'

import { getCleanUrlPathname } from '../getCleanUrlPathname'

describe('getCleanUrlPathname', () => {
  it.each([
    { url: 'https://example.com', pathname: '' },
    { url: 'https://example.com/', pathname: '' },
    { url: 'https://example.com/some/path', pathname: '/some/path' },
    { url: 'https://example.com/some/path/', pathname: '/some/path' },
    { url: 'https://example.com/some/path///', pathname: '/some/path' },
    { url: 'https://example.com/some/path/?page=2#top', pathname: '/some/path' }
  ])('Should give "$pathname" for $url', ({ url, pathname }) => {
    expect(getCleanUrlPathname(new URL(url))).toBe(pathname)
  })
})

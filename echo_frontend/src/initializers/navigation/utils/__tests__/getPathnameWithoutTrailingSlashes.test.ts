import { getPathnameWithoutTrailingSlashes } from '../getPathnameWithoutTrailingSlashes'

describe('getPathnameWithoutTrailingSlashes', () => {
  it.each([
    { url: 'https://example.com', pathname: '' },
    { url: 'https://example.com/', pathname: '' },
    { url: 'https://example.com/some/path', pathname: '/some/path' },
    { url: 'https://example.com/some/path/', pathname: '/some/path' },
    { url: 'https://example.com/some/path///', pathname: '/some/path' },
    { url: 'https://example.com/some/path/?page=2#top', pathname: '/some/path' }
  ])('Should give "$pathname" for $url', ({ url, pathname }) => {
    expect(getPathnameWithoutTrailingSlashes(new URL(url))).toBe(pathname)
  })
})

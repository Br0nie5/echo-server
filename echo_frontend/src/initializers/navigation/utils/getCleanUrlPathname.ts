/**
 * Gives the pathname of `url` without its trailing slashes.
 *
 * ```ts
 * getCleanUrlPathname(new URL('https://example.com/echo/app/')) // '/echo/app'
 * getCleanUrlPathname(new URL('https://example.com/')) // ''
 * ```
 */
export const getCleanUrlPathname = (url: URL): string => {
  return url.pathname.replace(/\/+$/, '')
}

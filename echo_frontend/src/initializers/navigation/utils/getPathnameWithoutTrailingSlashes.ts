/**
 * Gives the pathname of `url` without its trailing slashes.
 *
 * ```ts
 * getPathnameWithoutTrailingSlashes(new URL('https://example.com/echo/app/')) // '/echo/app'
 * getPathnameWithoutTrailingSlashes(new URL('https://example.com/')) // ''
 * ```
 */
export const getPathnameWithoutTrailingSlashes = (url: URL): string => {
  return url.pathname.replace(/\/+$/, '')
}

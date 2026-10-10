import { removeBasePath } from './removeBasePath.js'

/**
 * Gives the path the browser must be sent to for `location`, a path the server serves: `location`
 * below `basePath`, the path a reverse proxy serves Echo under.
 *
 * `location` is left as it is when `basePath` is empty, when it is not a path of this origin (a full
 * URL, `//host/path`, a relative path), or when it is already below `basePath`.
 *
 * ```ts
 * addBasePath('/documentation/', '/echo') // '/echo/documentation/'
 * addBasePath('https://domain.com/docs', '/echo') // 'https://domain.com/docs'
 * ```
 */
export const addBasePath = (location: string, basePath: string): string => {
  const isPathOfThisOrigin = location.startsWith('/') && !location.startsWith('//')

  if (basePath === '' || !isPathOfThisOrigin || removeBasePath(location, basePath) !== location) {
    return location
  }

  return `${basePath}${location}`
}

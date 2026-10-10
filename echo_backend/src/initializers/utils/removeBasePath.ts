/**
 * Gives the path and query of `url` below `basePath`, so the routes match whether the reverse
 * proxy forwarded the request with its path or without it.
 *
 * `url` is left as it is when it is not below `basePath`, or when `basePath` is empty: a path that
 * only starts like it (`/echoes` for `/echo`) is not below it.
 *
 * ```ts
 * removeBasePath('/echo/api/logs?fromDate=2026', '/echo') // '/api/logs?fromDate=2026'
 * removeBasePath('/api/logs', '/echo') // '/api/logs'
 * removeBasePath('/echo', '/echo') // '/'
 * ```
 */
export const removeBasePath = (url: string, basePath: string): string => {
  if (basePath === '' || !url.startsWith(basePath)) {
    return url
  }

  const urlBelowBasePath = url.slice(basePath.length)

  if (urlBelowBasePath === '' || urlBelowBasePath.startsWith('?')) {
    return `/${urlBelowBasePath}`
  }

  return urlBelowBasePath.startsWith('/') ? urlBelowBasePath : url
}

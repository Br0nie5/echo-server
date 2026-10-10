/** Where Echo is reached, parsed by `parseServerUrls`. */
export type ServerUrls = {
  /** `SERVER_URL` as it was written. */
  serverUrl: string
  /** `serverUrl` followed by `apiRoutePrefix`. */
  apiUrl: string
  /** `serverUrl` followed by `appRoutePrefix`. */
  appUrl: string
}

/**
 * Parses the URLs Echo is reached at from `serverUrl`, the value of `SERVER_URL`.
 *
 * `apiUrl` and `appUrl` are `serverUrl` followed by `apiRoutePrefix` and `appRoutePrefix`, so they
 * keep its path, the one a reverse proxy serves Echo under, whether it ends with a slash or not. It
 * throws when `serverUrl` is not a valid URL.
 *
 * ```ts
 * parseServerUrls('https://domain.com/echo/', '/api', '/app')
 * // { serverUrl: 'https://domain.com/echo/', apiUrl: 'https://domain.com/echo/api', appUrl: 'https://domain.com/echo/app' }
 * ```
 */
export const parseServerUrls = (
  serverUrl: string,
  apiRoutePrefix: string,
  appRoutePrefix: string
): ServerUrls => {
  let url: URL
  try {
    url = new URL(serverUrl)
  } catch {
    throw new Error(`Invalid SERVER_URL: ${serverUrl}`)
  }

  const serverPathname = url.pathname.replace(/\/+$/, '')
  const buildRouteUrl = (routePrefix: string): string =>
    new URL(`${serverPathname}${routePrefix}`, url.origin).toString()

  return {
    serverUrl,
    apiUrl: buildRouteUrl(apiRoutePrefix),
    appUrl: buildRouteUrl(appRoutePrefix)
  }
}

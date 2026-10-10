/**
 * Parses the path Echo is reached under behind a reverse proxy out of `serverUrl`: `/tools/echo`
 * for `https://domain.com/tools/echo/`, an empty string when Echo is at the root of its origin.
 *
 * A reverse proxy may forward a request with this path or without it, so the server takes both: it
 * tells them apart by the first part of the path. That part therefore cannot be the first part of
 * one of `routePrefixes`, the paths the server serves (`/api` for `https://domain.com/api/echo`):
 * it throws when it is, and a `TypeError` when `serverUrl` is not a valid URL.
 */
export const parseBasePath = (serverUrl: string, routePrefixes: string[]): string => {
  const basePath = new URL(serverUrl).pathname.replace(/\/+$/, '')
  const firstPathPart = basePath.split('/')[1]
  const conflictingRoutePrefix = routePrefixes.find(
    (routePrefix) => routePrefix.split('/')[1] === firstPathPart
  )

  if (conflictingRoutePrefix !== undefined) {
    throw new Error(
      `Invalid SERVER_URL: ${serverUrl}, its path cannot start with ${conflictingRoutePrefix}, ` +
        'which Echo serves itself'
    )
  }

  return basePath
}

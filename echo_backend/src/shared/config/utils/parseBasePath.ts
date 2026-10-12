/** A path made of one or more parts, each starting with a slash: `/echo`, `/tools/echo`. */
const BASE_PATH_PATTERN = /^(\/[A-Za-z0-9._~-]+)+$/

/**
 * Parses `BASE_PATH`, the path Echo is reached under behind a reverse proxy: `/tools/echo` when it
 * is served at `https://domain.com/tools/echo/`.
 *
 * It is an empty string, Echo then being at the root of its origin, when `raw` is missing, empty
 * or a lone slash. Its trailing slashes are left out. A reverse proxy may forward a request with
 * this path or without it, so the server takes both: it tells them apart by the first part of the
 * path. That part therefore cannot be the first part of one of `routePrefixes`, the paths the
 * server serves (`/api` for `/api/echo`): it throws when it is. It throws too when `raw` is not a
 * path starting with a slash, whose parts hold only letters, digits, `.`, `_`, `~` and `-`.
 *
 * ```ts
 * parseBasePath('/tools/echo/', ['/api', '/app']) // '/tools/echo'
 * parseBasePath(undefined, ['/api', '/app']) // ''
 * ```
 */
export const parseBasePath = (raw: string | undefined, routePrefixes: string[]): string => {
  const basePath = (raw ?? '').replace(/\/+$/, '')

  if (basePath === '') {
    return basePath
  }

  if (!BASE_PATH_PATTERN.test(basePath)) {
    throw new Error(`Invalid BASE_PATH: ${raw}, it must be a path like /echo or /tools/echo`)
  }

  const firstPathPart = basePath.split('/')[1]
  const conflictingRoutePrefix = routePrefixes.find(
    (routePrefix) => routePrefix.split('/')[1] === firstPathPart
  )

  if (conflictingRoutePrefix !== undefined) {
    throw new Error(
      `Invalid BASE_PATH: ${raw}, it cannot start with ${conflictingRoutePrefix}, ` +
        'which Echo serves itself'
    )
  }

  return basePath
}

import type { CookieSerializeOptions } from '@fastify/cookie'

/**
 * Builds the options the session cookie is set with, from `basePath` and `sessionDurationSeconds`.
 *
 * The cookie lasts `sessionDurationSeconds` and is out of reach of the scripts of the page. It is
 * bound to no domain, so the browser only sends it back to the host that set it. It is only sent
 * to `basePath`, the path a reverse proxy serves Echo under, and below it (to every path when it is
 * empty), so two instances served at two paths of one host each keep their own session. Whether it
 * is only sent over HTTPS is decided for each request, from the protocol the request was sent
 * with: a browser refuses to store a secure cookie an HTTP page sets.
 *
 * ```ts
 * const cookieSerializeOptions = createCookieSerializeOptions('/echo', 24 * 60 * 60)
 * ```
 */
export const createCookieSerializeOptions = (
  basePath: string,
  sessionDurationSeconds: number
): CookieSerializeOptions => ({
  path: basePath || '/',
  secure: 'auto',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: sessionDurationSeconds
})

/**
 * Tells whether a request carrying the `Origin` header `origin` may read the answer of the server.
 *
 * It may when `origin` has `requestHost`, the host the request was sent to, as its host and port:
 * the page was then loaded from the very address the request is sent to, so the server serves it
 * itself, and it is not a cross-origin request at all.
 *
 * Throws a `TypeError` when `origin` is not a URL.
 *
 * ```ts
 * isOriginAllowed('https://logs.domain.com', 'logs.domain.com') // true
 * isOriginAllowed('https://evil.com', '192.168.1.1:4000') // false
 * ```
 */
export const isOriginAllowed = (origin: string, requestHost: string): boolean =>
  new URL(origin).host === requestHost

import type { CookieSerializeOptions } from '@fastify/cookie'

import { isIpAddressHostname } from '../../utils/isIpAddressHostname.js'

/**
 * Builds the options the session cookie is set with, from `allowedDomain`, `serverUrl` and
 * `sessionDurationSeconds`.
 *
 * The cookie lasts `sessionDurationSeconds` and is out of reach of the scripts of the page. On `localhost` or on an
 * IP address, which a cookie cannot be bound to, it is bound to no domain; on any other domain it
 * is bound to that domain, its subdomains included. It is only sent over HTTPS when `serverUrl`,
 * the address the browser reaches the server at, uses `https://`: a browser refuses to store a
 * secure cookie an HTTP page sets, so it is not secure over HTTP, in development for instance.
 *
 * ```ts
 * const cookieSerializeOptions = parseCookieSerializeOptions(
 *   'domain.com',
 *   'https://logs.domain.com',
 *   24 * 60 * 60
 * )
 * ```
 */
export const parseCookieSerializeOptions = (
  allowedDomain: string,
  serverUrl: string,
  sessionDurationSeconds: number
): CookieSerializeOptions => ({
  domain:
    allowedDomain !== 'localhost' && !isIpAddressHostname(allowedDomain)
      ? allowedDomain
      : undefined,
  path: '/',
  secure: new URL(serverUrl).protocol === 'https:',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: sessionDurationSeconds
})

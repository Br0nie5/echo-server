import type { CookieSerializeOptions } from '@fastify/cookie'

import { isIpAddressHostname } from '../../utils/isIpAddressHostname.js'

/**
 * Builds the options the session cookie is set with on `allowedDomain`.
 *
 * The cookie lasts one day and is out of reach of the scripts of the page. On `localhost` or on an
 * IP address, which a cookie cannot be bound to, it is bound to no domain and is sent over HTTP
 * too; on any other domain it is bound to that domain, its subdomains included, and is only sent
 * over HTTPS.
 */
export const parseCookieSerializeOptions = (allowedDomain: string): CookieSerializeOptions => {
  const isIpAddress = isIpAddressHostname(allowedDomain)

  return {
    domain: allowedDomain !== 'localhost' && !isIpAddress ? allowedDomain : undefined,
    path: '/',
    secure: !allowedDomain.includes('localhost') && !isIpAddress,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60
  }
}

import type { CookieSerializeOptions } from '@fastify/cookie'

/**
 * Builds the options the session cookie is set with on `allowedDomain`.
 *
 * The cookie lasts one day and is out of reach of the scripts of the page. On `localhost` it is
 * bound to no domain and is sent over HTTP too; on any other domain it is bound to that domain,
 * its subdomains included, and is only sent over HTTPS.
 */
export const parseCookieSerializeOptions = (allowedDomain: string): CookieSerializeOptions => ({
  domain: allowedDomain !== 'localhost' ? allowedDomain : undefined,
  path: '/',
  secure: !allowedDomain.includes('localhost'),
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 24 * 60 * 60
})

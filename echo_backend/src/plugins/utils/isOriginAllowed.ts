import { isIpAddressHostname } from '../../shared/utils/isIpAddressHostname.js'

/** The addresses a browser reaches the machine it runs on at, other than the name `localhost`. */
const LOOPBACK_IP_HOSTNAMES = ['127.0.0.1', '[::1]']

/** What an origin is checked against. */
export interface AllowedOrigins {
  /** Domain the server is configured to be reached at. */
  allowedDomain: string
  /** Host, with its port, the request was sent to: the one of its `Host` header. */
  requestHost: string
}

/**
 * Tells whether a request carrying the `Origin` header `origin` may read the answer of the server.
 *
 * It may when the page it comes from is one the server serves itself:
 * - `origin` has `requestHost` as its host and port: the page was loaded from the very address
 *   the request is sent to, which is not a cross-origin request at all, whatever the server is
 *   configured with
 * - `origin` is on `allowedDomain` or, unless it is an IP address, on one of its subdomains
 * - `allowedDomain` is `localhost` and `origin` is on a loopback address
 *
 * Throws a `TypeError` when `origin` is not a URL.
 *
 * ```ts
 * isOriginAllowed('https://logs.domain.com', { allowedDomain: 'domain.com', requestHost: 'domain.com' }) // true
 * isOriginAllowed('https://evil.com', { allowedDomain: 'localhost', requestHost: '192.168.1.1:4000' }) // false
 * ```
 */
export const isOriginAllowed = (
  origin: string,
  { allowedDomain, requestHost }: AllowedOrigins
): boolean => {
  const { host, hostname } = new URL(origin)

  if (host === requestHost || hostname === allowedDomain) {
    return true
  }

  if (allowedDomain === 'localhost' && LOOPBACK_IP_HOSTNAMES.includes(hostname)) {
    return true
  }

  return !isIpAddressHostname(allowedDomain) && hostname.endsWith(`.${allowedDomain}`)
}

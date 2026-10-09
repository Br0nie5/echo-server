import { parse } from 'tldts'

import { isIpAddressHostname } from '../../utils/isIpAddressHostname.js'

/**
 * Parses the domain allowed by CORS and used for the session cookie out of `serverUrl`.
 *
 * It is the registrable domain of the host of `serverUrl`, without its subdomains
 * (`domain.com` for `https://subdomain.domain.com:3700`), or the host itself when it has none: a
 * bare name (`localhost`, `my-server`) or an IP address (`192.168.1.1`, `[::1]`). It throws a
 * `TypeError` when `serverUrl` is not a valid URL.
 */
export const parseAllowedDomain = (serverUrl: string): string => {
  const { hostname } = new URL(serverUrl)

  if (isIpAddressHostname(hostname)) {
    return hostname
  }

  return parse(hostname).domain || hostname
}

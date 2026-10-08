import { isIP } from 'net'

import { parse } from 'tldts'

/**
 * Parses the domain allowed by CORS and used for the session cookie out of `serverUrl`.
 *
 * It is the registrable domain of the host of `serverUrl`, without its subdomains
 * (`domain.com` for `https://subdomain.domain.com:3700`), or the host itself when it has none
 * (`localhost`, `my-server`). It is `localhost` when the host is an IP address, since a cookie
 * cannot be set on an IP domain. It throws a `TypeError` when `serverUrl` is not a valid URL.
 */
export const parseAllowedDomain = (serverUrl: string): string => {
  const parsedServerUrl = new URL(serverUrl)

  const serverUrlDomain = parse(parsedServerUrl.hostname).domain || parsedServerUrl.hostname

  return isIP(serverUrlDomain) !== 0 ? 'localhost' : serverUrlDomain
}

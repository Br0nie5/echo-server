import { isIP } from 'net'

import { getDomain } from '@echo/utilities'

/**
 * Parses the domain allowed by CORS and used for the session cookie out of `serverUrl`, which
 * must be a valid URL.
 *
 * It is `localhost` when the host of `serverUrl` is an IP address, since a cookie cannot be set
 * on an IP domain.
 */
export const parseAllowedDomain = (serverUrl: string): string => {
  // serverUrl is already a validated URL by this point,
  // so getDomain can only return its hostname fallback here, never undefined.
  const serverUrlDomain = getDomain(serverUrl) as string

  return isIP(serverUrlDomain) !== 0 ? 'localhost' : serverUrlDomain
}

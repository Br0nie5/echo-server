import { isIP } from 'net'

/** What separates the entries of `TRUSTED_PROXIES`. */
const ENTRIES_SEPARATOR = ';'

/** The names standing for a range of addresses: the machine itself, its link, a private network. */
const ADDRESS_RANGE_NAMES = ['loopback', 'linklocal', 'uniquelocal']

const HIGHEST_PREFIX_LENGTH_BY_IP_VERSION: Record<number, number> = { 4: 32, 6: 128 }

/**
 * Whether `entry` is an IP address (`10.0.0.1`, `::1`) or a range of them in CIDR notation
 * (`10.0.0.0/8`).
 */
const isAddressOrAddressRange = (entry: string): boolean => {
  const [address, prefixLength, ...unexpectedParts] = entry.split('/')
  const ipVersion = isIP(address)

  if (ipVersion === 0 || unexpectedParts.length > 0) {
    return false
  }

  return (
    prefixLength === undefined ||
    (/^\d+$/.test(prefixLength) &&
      Number(prefixLength) <= HIGHEST_PREFIX_LENGTH_BY_IP_VERSION[ipVersion])
  )
}

/**
 * Parses `TRUSTED_PROXIES`, the reverse proxies whose `X-Forwarded-*` headers the server believes.
 *
 * `raw` is a list separated by semicolons, given back as an array, the spaces around its entries
 * and its empty entries left out. Each entry is an IP address, a range of them in CIDR notation,
 * or one of `loopback`, `linklocal` and `uniquelocal`: it throws on any other one, a host name
 * included, which is never resolved.
 *
 * It is `undefined` when `raw` is missing or holds no entry: whatever sends the request is then
 * trusted, so the server works behind any reverse proxy without being told about it.
 *
 * ```ts
 * parseTrustedProxies('10.0.0.1; 172.16.0.0/12;') // ['10.0.0.1', '172.16.0.0/12']
 * parseTrustedProxies(' ') // undefined
 * parseTrustedProxies(undefined) // undefined
 * ```
 */
export const parseTrustedProxies = (raw: string | undefined): string[] | undefined => {
  const entries = (raw ?? '')
    .split(ENTRIES_SEPARATOR)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '')

  if (entries.length === 0) {
    return undefined
  }

  const invalidEntry = entries.find(
    (entry) => !ADDRESS_RANGE_NAMES.includes(entry) && !isAddressOrAddressRange(entry)
  )

  if (invalidEntry !== undefined) {
    throw new Error(
      `Invalid proxy: "${invalidEntry}" is neither an IP address, a range of them like ` +
        `10.0.0.0/8, nor one of ${ADDRESS_RANGE_NAMES.join(', ')}`
    )
  }

  return entries
}

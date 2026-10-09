import { isIP } from 'net'

/**
 * Whether `hostname`, the host of a URL without its port, is an IP address and not a name.
 *
 * An IPv6 address is recognized with the brackets a URL writes it between (`[::1]`) or without.
 */
export const isIpAddressHostname = (hostname: string): boolean =>
  isIP(hostname.replace(/^\[|\]$/g, '')) !== 0

import { describe, expect, it } from 'vitest'

import { isIpAddressHostname } from '../isIpAddressHostname.js'

describe('isIpAddressHostname', () => {
  it('Should recognize an IPv4 address', () => {
    expect(isIpAddressHostname('192.168.1.1')).toBe(true)
  })

  it('Should recognize an IPv6 address, with or without its brackets', () => {
    expect(isIpAddressHostname('[::1]')).toBe(true)
    expect(isIpAddressHostname('::1')).toBe(true)
  })

  it('Should not take a name for an IP address', () => {
    expect(isIpAddressHostname('localhost')).toBe(false)
    expect(isIpAddressHostname('domain.com')).toBe(false)
  })
})

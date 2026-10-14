import { describe, it, expect } from 'vitest'

import { parseTrustedProxies } from '../parseTrustedProxies.js'

describe('parseTrustedProxies', () => {
  it.each([undefined, '', '  ', ' ; ;'])(
    'Should trust whatever sends the request when the value is %o',
    (raw) => {
      expect(parseTrustedProxies(raw)).toBeUndefined()
    }
  )

  it('Should give the listed addresses, ranges and named ranges, without the spaces around them nor the empty entries', () => {
    expect(parseTrustedProxies('10.0.0.1; 172.16.0.0/12 ;;::1;fd00::/8;loopback;')).toStrictEqual([
      '10.0.0.1',
      '172.16.0.0/12',
      '::1',
      'fd00::/8',
      'loopback'
    ])
  })

  it.each(['linklocal', 'uniquelocal', '0.0.0.0/0', '10.0.0.1/32', '::/128'])(
    'Should accept %s',
    (raw) => {
      expect(parseTrustedProxies(raw)).toStrictEqual([raw])
    }
  )

  it.each([
    ['proxy.domain.com', 'proxy.domain.com'],
    ['reverse_proxy', 'reverse_proxy'],
    ['10.0.0.1, 10.0.0.2', '10.0.0.1, 10.0.0.2'],
    ['10.0.0.0/33', '10.0.0.0/33'],
    ['::1/129', '::1/129'],
    ['10.0.0.0/8/8', '10.0.0.0/8/8'],
    ['10.0.0.0/', '10.0.0.0/'],
    ['10.0.0.1; 10.0.0.0/255.0.0.0', '10.0.0.0/255.0.0.0'],
    ['true', 'true'],
    ['10.0.0.1; none', 'none'],
    ['all; 10.0.0.1', 'all']
  ])('Should throw on %s', (raw, invalidEntry) => {
    expect(() => parseTrustedProxies(raw)).toThrow(
      `Invalid proxy: "${invalidEntry}" is neither an IP address, a range of them like ` +
        '10.0.0.0/8, nor one of loopback, linklocal, uniquelocal'
    )
  })
})

import { describe, it, expect } from 'vitest'

import { parseCookieSerializeOptions } from '../parseCookieSerializeOptions.js'

describe('parseCookieSerializeOptions', () => {
  it('should bind the cookie to the allowed domain and make it secure if it is not localhost', () => {
    expect(parseCookieSerializeOptions('allowed-domain.com')).toStrictEqual({
      domain: 'allowed-domain.com',
      httpOnly: true,
      maxAge: 86400,
      path: '/',
      sameSite: 'lax',
      secure: true
    })
  })

  it.each(['localhost', '192.168.1.1', '[::1]'])(
    'should neither bind the cookie to a domain nor make it secure if the allowed domain is %s',
    (allowedDomain) => {
      expect(parseCookieSerializeOptions(allowedDomain)).toStrictEqual({
        domain: undefined,
        httpOnly: true,
        maxAge: 86400,
        path: '/',
        sameSite: 'lax',
        secure: false
      })
    }
  )
})

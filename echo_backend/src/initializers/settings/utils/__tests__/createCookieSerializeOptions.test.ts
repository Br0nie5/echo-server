import { describe, it, expect } from 'vitest'

import { createCookieSerializeOptions } from '../createCookieSerializeOptions.js'

describe('createCookieSerializeOptions', () => {
  it('Should bind the cookie to no domain and let each request decide whether it is secure', () => {
    expect(createCookieSerializeOptions('', 86400)).toStrictEqual({
      httpOnly: true,
      maxAge: 86400,
      path: '/',
      sameSite: 'lax',
      secure: 'auto'
    })
  })

  it('Should send the cookie to the base path and below it only', () => {
    expect(createCookieSerializeOptions('/tools/echo', 86400).path).toBe('/tools/echo')
  })

  it('Should make the cookie last the session duration', () => {
    expect(createCookieSerializeOptions('', 3600).maxAge).toBe(3600)
  })
})

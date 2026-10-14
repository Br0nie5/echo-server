import { describe, it, expect } from 'vitest'

import { createSessionCookieName } from '../createSessionCookieName.js'

describe('createSessionCookieName', () => {
  it('Should name the cookie after the server', () => {
    expect(createSessionCookieName('Echo-server_2')).toBe('Echo-server_2_echo_access_token')
  })

  it.each([
    ['Shop Production', 'Shop_Production_echo_access_token'],
    ['echo.domain.com', 'echo_domain_com_echo_access_token'],
    ['Écho; "prod"=1', '_cho___prod__1_echo_access_token']
  ])('Should replace what the name of a cookie cannot hold in %s', (serverName, cookieName) => {
    expect(createSessionCookieName(serverName)).toBe(cookieName)
  })
})

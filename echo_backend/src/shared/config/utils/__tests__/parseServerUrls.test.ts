import { describe, it, expect } from 'vitest'

import { parseServerUrls } from '../parseServerUrls.js'

describe('parseServerUrls', () => {
  it('Should put the API and the app below the server URL', () => {
    expect(parseServerUrls('https://domain.com:3700', '/api', '/app')).toStrictEqual({
      serverUrl: 'https://domain.com:3700',
      apiUrl: 'https://domain.com:3700/api',
      appUrl: 'https://domain.com:3700/app'
    })
  })

  it('Should keep the path of the server URL, whether it ends with a slash or not', () => {
    expect(parseServerUrls('https://domain.com/tools/echo', '/api', '/app')).toStrictEqual({
      serverUrl: 'https://domain.com/tools/echo',
      apiUrl: 'https://domain.com/tools/echo/api',
      appUrl: 'https://domain.com/tools/echo/app'
    })
    expect(parseServerUrls('https://domain.com/echo/', '/api', '/app').apiUrl).toBe(
      'https://domain.com/echo/api'
    )
  })

  it('Should throw when the server URL is not a valid URL', () => {
    expect(() => parseServerUrls('not a valid url', '/api', '/app')).toThrow(
      'Invalid SERVER_URL: not a valid url'
    )
  })
})

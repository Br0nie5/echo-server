import { describe, expect, test } from 'vitest'

import { getRedirectionPathOnAuth } from '../getRedirectionPathOnAuth'

const appUrl = 'https://example.com/echo/app'

describe('getRedirectionPathOnAuth', () => {
  test('Should give the logs screen when there is no redirect', () => {
    expect(getRedirectionPathOnAuth(null, appUrl)).toBe('/logs')
  })

  test('Should give the redirect when it is a path of the app', () => {
    const redirect = '/logs?fromDate=2026-04-26T00%3A00%3A00.000Z#top'

    expect(getRedirectionPathOnAuth(redirect, appUrl)).toBe(redirect)
  })

  test('Should keep a path starting with two slashes inside the app', () => {
    expect(getRedirectionPathOnAuth('//elsewhere.com/logs', appUrl)).toBe('//elsewhere.com/logs')
  })

  test.each([
    ['a full address', 'https://elsewhere.com/echo/app/logs'],
    ['a relative path', 'logs'],
    ['a path leaving the app', '/../api/logs'],
    ['a script', 'javascript:alert(document.cookie)']
  ])('Should give the logs screen when the redirect is %s', (_, redirect) => {
    expect(getRedirectionPathOnAuth(redirect, appUrl)).toBe('/logs')
  })
})

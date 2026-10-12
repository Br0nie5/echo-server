import { mockConfig } from '../mocks/mockConfig'

/**
 * Gives the path the app rendered by `renderRealRouterApp` or `renderFakeRouterApp` is at, below
 * `APP_URL`, with its query string.
 *
 * ```ts
 * await waitFor(() => expect(getAppPath()).toBe('/logs?logSearch=text'))
 * ```
 */
export const getAppPath = (): string => {
  const { pathname, search } = window.location

  return `${pathname.slice(new URL(mockConfig.APP_URL).pathname.length)}${search}`
}

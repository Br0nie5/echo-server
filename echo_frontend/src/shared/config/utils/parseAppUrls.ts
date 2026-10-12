import { apiRoutePrefix } from '@echo/utilities'

/** Where the app and the API are reached, parsed by `parseAppUrls`. */
export type AppUrls = {
  /** Where the app is served, without a trailing slash. */
  APP_URL: string
  /** Where the API is served. */
  API_URL: string
}

/**
 * Parses where the app and the API are reached from `baseUri`, the URL the page resolves its links
 * against.
 *
 * Whatever serves the page gives it a `<base>` saying where the app is served, the path a reverse
 * proxy serves it under included. The app is that URL, and the API is next to it, under
 * `apiRoutePrefix`: both are on the host the user reached, whatever it is.
 *
 * ```ts
 * parseAppUrls('https://example.com/echo/app/')
 * // { APP_URL: 'https://example.com/echo/app', API_URL: 'https://example.com/echo/api' }
 * ```
 */
export const parseAppUrls = (baseUri: string): AppUrls => ({
  APP_URL: new URL('.', baseUri).href.replace(/\/+$/, ''),
  API_URL: new URL(`..${apiRoutePrefix}`, baseUri).href
})

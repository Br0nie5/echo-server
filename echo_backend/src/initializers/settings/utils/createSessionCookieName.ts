/**
 * Builds the name of the cookie holding the session of the server named `serverName`.
 *
 * It is `serverName` followed by `_echo_access_token`, every character of `serverName` other than a
 * letter, a digit, `-` or `_` being replaced with `_`, since the name of a cookie holds neither a
 * space nor a separator. Two instances reached on one host therefore keep their own session when
 * they are named differently.
 *
 * ```ts
 * createSessionCookieName('Shop Production') // 'Shop_Production_echo_access_token'
 * ```
 */
export const createSessionCookieName = (serverName: string): string =>
  `${serverName.replace(/[^a-zA-Z0-9-_]/g, '_')}_echo_access_token`

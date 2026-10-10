import { AppPathNames } from '../../../../shared/navigation/pathNames'

/**
 * Gives the path, below `appUrl`, to go to once authenticated: `redirect`, the `redirect` query
 * param, when it is a path of the app, otherwise the logs screen.
 *
 * `redirect` is a path below `appUrl` (`/logs?fromDate=…`), as the 401 of a request sets it. Anyone
 * can write it in a link, so anything else is refused: a path that does not start with `/`, and
 * one leaving the app once resolved (`/../api`).
 *
 * ```ts
 * getRedirectionPathOnAuth('/logs?logSearch=text', 'https://example.com/app') // '/logs?logSearch=text'
 * getRedirectionPathOnAuth('/../api', 'https://example.com/app') // '/logs'
 * ```
 */
export const getRedirectionPathOnAuth = (redirect: string | null, appUrl: string): string => {
  if (redirect === null || !redirect.startsWith('/') || !URL.canParse(`${appUrl}${redirect}`)) {
    return AppPathNames.logs
  }

  const redirectionUrl = new URL(`${appUrl}${redirect}`).href

  return redirectionUrl.startsWith(`${appUrl}/`)
    ? redirectionUrl.slice(appUrl.length)
    : AppPathNames.logs
}

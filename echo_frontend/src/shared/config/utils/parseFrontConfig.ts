import { parseConfig } from '@echo/utilities'

import type { FrontConfig } from '../frontConfig'

import { parseAppUrls } from './parseAppUrls'
import { parseDaysAgo } from './parseDaysAgo'

/**
 * Builds the `FrontConfig` from `rawConfig`, the content of `env.<mode>.json`, and `baseUri`, the
 * URL the page resolves its links against, which says where the app and the API are reached (see
 * `parseAppUrls`).
 *
 * The variables common to the backend and the frontend are read by `parseConfig`. It throws when
 * one of them, `LOGS_INITIAL_DATE_DAYS_AGO` or `LOGS_MINIMAL_DATE_DAYS_AGO` is missing or invalid,
 * and when `LOGS_INITIAL_DATE_DAYS_AGO` is further back than `LOGS_MINIMAL_DATE_DAYS_AGO`: the
 * logs would start before the oldest date the user can pick.
 *
 * ```ts
 * const response = await fetch(configJsonBaseUrl)
 * const config = parseFrontConfig(await response.json(), document.baseURI)
 * config.LOGS_INITIAL_DATE_DAYS_AGO // 2
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseFrontConfig = (rawConfig: any, baseUri: string): FrontConfig => {
  const LOGS_INITIAL_DATE_DAYS_AGO = parseDaysAgo(
    rawConfig.LOGS_INITIAL_DATE_DAYS_AGO,
    'LOGS_INITIAL_DATE_DAYS_AGO'
  )
  const LOGS_MINIMAL_DATE_DAYS_AGO = parseDaysAgo(
    rawConfig.LOGS_MINIMAL_DATE_DAYS_AGO,
    'LOGS_MINIMAL_DATE_DAYS_AGO'
  )

  if (LOGS_INITIAL_DATE_DAYS_AGO > LOGS_MINIMAL_DATE_DAYS_AGO) {
    throw new Error(
      `Invalid LOGS_INITIAL_DATE_DAYS_AGO: ${LOGS_INITIAL_DATE_DAYS_AGO} is greater than ` +
        `LOGS_MINIMAL_DATE_DAYS_AGO (${LOGS_MINIMAL_DATE_DAYS_AGO})`
    )
  }

  return {
    ...parseConfig(rawConfig),
    ...parseAppUrls(baseUri),
    LOGS_INITIAL_DATE_DAYS_AGO,
    LOGS_MINIMAL_DATE_DAYS_AGO
  }
}

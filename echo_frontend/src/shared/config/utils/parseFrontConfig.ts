import { parseConfig, parseRequiredEnv } from '@echo/utilities'

import type { FrontConfig } from '../frontConfig'

import { parseAppUrls } from './parseAppUrls'
import { parseDaysAgoNumber } from './parseDaysAgoNumber'

/**
 * Builds the `FrontConfig` from `rawConfig`, the content of `env.<mode>.json`, and `baseUri`, the
 * URL the page resolves its links against, which says where the app and the API are reached (see
 * `parseAppUrls`).
 *
 * The variables of the shared `Config` are read by `parseConfig`, the two others by
 * `parseDaysAgoNumber`, each written as text or as a number. Throws when one of them is missing or
 * invalid, and when `LOGS_INITIAL_DATE_DAYS_AGO` is further back than
 * `LOGS_MINIMAL_DATE_DAYS_AGO`: the logs would start before the oldest date the user can pick.
 *
 * ```ts
 * const response = await fetch(configJsonUrl)
 * const config = parseFrontConfig(await response.json(), document.baseURI)
 * config.LOGS_INITIAL_DATE_DAYS_AGO // 2
 * ```
 */
export const parseFrontConfig = (
  rawConfig: Record<string, unknown>,
  baseUri: string
): FrontConfig => {
  const LOGS_INITIAL_DATE_DAYS_AGO = parseRequiredEnv(
    rawConfig,
    'LOGS_INITIAL_DATE_DAYS_AGO',
    parseDaysAgoNumber
  )
  const LOGS_MINIMAL_DATE_DAYS_AGO = parseRequiredEnv(
    rawConfig,
    'LOGS_MINIMAL_DATE_DAYS_AGO',
    parseDaysAgoNumber
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
    LOGS_MINIMAL_DATE_DAYS_AGO,
    LOGS_MAXIMAL_DATE_DAYS_AGO: 0
  }
}

import { parseConfig, parseRequiredEnv } from '@echo/utilities'

import type { FrontConfig } from '../frontConfig'

import { getDateFromDaysAgo } from './getDateFromDaysAgo'
import { parseAppUrls } from './parseAppUrls'
import { parseDaysAgoNumber } from './parseDaysAgoNumber'

/**
 * Builds the `FrontConfig` from `rawConfig`, the content of `env.<mode>.json`, and
 * `baseUri`, the URL the page resolves its links against, which says where the app and the API are
 * reached (see `parseAppUrls`).
 *
 * The variables of the shared `Config` are read by `parseConfig`, the two others by
 * `parseDaysAgoNumber`, each written as text or as a number. Throws when one of them is missing or
 * invalid, and when `LOGS_INITIAL_DATE_DAYS_AGO` is further back than
 * `LOGS_MINIMAL_DATE_DAYS_AGO`: the logs would start before the oldest date the user can pick.
 *
 * The numbers of days ago become the dates the logs start at, from the current date: they stay the
 * same until the config is parsed again.
 *
 * ```ts
 * const response = await fetch(configJsonUrl)
 * const config = parseFrontConfig(await response.json(), document.baseURI)
 * config.logsMinimalDate // the first instant of the day 14 days ago
 * ```
 */
export const parseFrontConfig = (
  rawConfig: Record<string, unknown>,
  baseUri: string
): FrontConfig => {
  const logsInitialDateDaysAgo = parseRequiredEnv(
    rawConfig,
    'LOGS_INITIAL_DATE_DAYS_AGO',
    parseDaysAgoNumber
  )
  const logsMinimalDateDaysAgo = parseRequiredEnv(
    rawConfig,
    'LOGS_MINIMAL_DATE_DAYS_AGO',
    parseDaysAgoNumber
  )

  if (logsInitialDateDaysAgo > logsMinimalDateDaysAgo) {
    throw new Error(
      `Invalid LOGS_INITIAL_DATE_DAYS_AGO: ${logsInitialDateDaysAgo} is greater than ` +
        `LOGS_MINIMAL_DATE_DAYS_AGO (${logsMinimalDateDaysAgo})`
    )
  }

  return {
    ...parseConfig(rawConfig),
    ...parseAppUrls(baseUri),
    logsInitialDate: getDateFromDaysAgo(logsInitialDateDaysAgo),
    logsMinimalDate: getDateFromDaysAgo(logsMinimalDateDaysAgo),
    logsMaximalDate: getDateFromDaysAgo(0)
  }
}

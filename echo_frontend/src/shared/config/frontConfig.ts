import type { Config } from '@echo/utilities'

import type { AppUrls } from './utils/parseAppUrls'

/**
 * The configuration of the frontend.
 *
 * It is the `Config` common to the backend and the frontend, plus what only the frontend needs: the
 * `AppUrls`, read from the page, and the variables of the frontend. It is built by
 * `parseFrontConfig`, from the content of `env.<mode>.json` and the URL of the page, and read
 * through `useConfig`.
 */
export type FrontConfig = Config &
  AppUrls & {
    /** How many days back the logs start when the URL gives no `fromDate`. */
    LOGS_INITIAL_DATE_DAYS_AGO: number
    /** How many days back the logs can start at most. */
    LOGS_MINIMAL_DATE_DAYS_AGO: number
  }

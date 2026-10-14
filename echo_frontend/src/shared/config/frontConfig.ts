import type { Config } from '@echo/utilities'

import type { AppUrls } from './utils/parseAppUrls'

/**
 * The configuration of the app.
 *
 * It is the shared `Config` of `@echo/utilities`, plus what only the app needs: the `AppUrls`, read
 * from the page, and the dates the logs start at, made of its own variables when the app loads. It
 * is built by `parseFrontConfig`, from the content of `env.<mode>.json` and the URL of the page,
 * and read through `useConfig`.
 */
export type FrontConfig = Config &
  AppUrls & {
    /**
     * Where the logs start when the URL gives no `fromDate`: the first instant of the day
     * `LOGS_INITIAL_DATE_DAYS_AGO` days ago.
     */
    logsInitialDate: Date
    /**
     * The earliest date the logs can start at: the first instant of the day
     * `LOGS_MINIMAL_DATE_DAYS_AGO` days ago.
     */
    logsMinimalDate: Date
    /** The latest date the logs can start at: the first instant of today. */
    logsMaximalDate: Date
  }

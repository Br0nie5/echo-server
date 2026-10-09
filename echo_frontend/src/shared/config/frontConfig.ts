import type { Config } from '@echo/utilities'

/**
 * The configuration of the frontend.
 *
 * It is the `Config` common to the backend and the frontend, plus what only the frontend needs. It
 * is built by `parseFrontConfig`, from the content of `env.<mode>.json`, and read through
 * `useConfig`.
 */
export type FrontConfig = Config & {
  /** How many days back the logs start when the URL gives no `fromDate`. */
  LOGS_INITIAL_DATE_DAYS_AGO: number
  /** How many days back the logs can start at most. */
  LOGS_MINIMAL_DATE_DAYS_AGO: number
}

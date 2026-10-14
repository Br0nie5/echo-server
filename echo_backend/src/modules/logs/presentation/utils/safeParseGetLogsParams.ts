import { GetLogsParamsSchema } from '@echo/utilities'
import type { z } from 'zod'

const ParsedGetLogsParamsSchema = GetLogsParamsSchema.extend({
  fromDate: GetLogsParamsSchema.shape.fromDate.transform((value) => new Date(value)),
  toDate: GetLogsParamsSchema.shape.toDate.transform((value) =>
    value === undefined ? undefined : new Date(value)
  ),
  logLevels: GetLogsParamsSchema.shape.logLevels.transform((value) => (value ? [value].flat() : []))
})

/**
 * The query of `GET /logs` once validated: `fromDate` and `toDate` as `Date`s, and `logLevels` as
 * an array, empty when the client sent none.
 */
export type ParsedGetLogsParams = z.output<typeof ParsedGetLogsParamsSchema>

/**
 * Validates `query`, the query of `GET /logs` as the client sent it, and turns it into the
 * `ParsedGetLogsParams` that `getFilteredLogs` needs.
 *
 * The validation is the one of `GetLogsParamsSchema`, whose dates always carry their time zone. On
 * failure, the messages of `error.issues` are written for the client, and name what is wrong.
 *
 * ```ts
 * const parsedParams = safeParseGetLogsParams(query)
 * if (!parsedParams.success) {
 *   return { error: new Error(parsedParams.error.issues[0].message) }
 * }
 * const { fromDate, toDate, logLevels, logSearch } = parsedParams.data
 * ```
 */
export const safeParseGetLogsParams = (query: unknown): z.ZodSafeParseResult<ParsedGetLogsParams> =>
  ParsedGetLogsParamsSchema.safeParse(query)

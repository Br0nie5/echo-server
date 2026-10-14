import type { GetLogsParams } from '@echo/utilities'
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
 * Validates the query of `GET /logs` and turns it into what `getFilteredLogs` needs.
 *
 * The validation is the one of `GetLogsParamsSchema`, whose dates always carry their time zone. On
 * success, `data` holds the query with `fromDate` and `toDate` as `Date`s and `logLevels` as an
 * array, empty when the client sent none. On failure, the messages of `error.issues` are meant to
 * be returned to the client as they are.
 *
 * ```ts
 * const parsedParams = safeParseGetLogsParams(request.query)
 * if (!parsedParams.success) {
 *   return reply.status(400).send({ statusCode: 400, message: parsedParams.error.issues[0].message })
 * }
 * const { fromDate, toDate, logLevels, logSearch } = parsedParams.data
 * ```
 */
export const safeParseGetLogsParams = (
  query: GetLogsParams
): z.ZodSafeParseResult<z.output<typeof ParsedGetLogsParamsSchema>> =>
  ParsedGetLogsParamsSchema.safeParse(query)

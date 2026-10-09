import type { GetLogsParams } from '@echo/utilities'
import { GetLogsParamsSchema } from '@echo/utilities'
import { z } from 'zod'

import { convertToDateFromISO } from '../../../../shared/utils/convertToDate.js'

const ParsedGetLogsParamsSchema = GetLogsParamsSchema.extend({
  fromDate: GetLogsParamsSchema.shape.fromDate.transform((value, context) => {
    const date = convertToDateFromISO(value)

    if (!date) {
      context.addIssue({
        code: 'custom',
        message: 'Field fromDate is not a valid date, it should be an ISO string'
      })
      return z.NEVER
    }

    return date
  }),
  logCategories: GetLogsParamsSchema.shape.logCategories.transform((value) =>
    value ? [value].flat() : []
  )
})

/**
 * Validates the query of `GET /logs` and turns it into what `getFilteredLogs` needs.
 *
 * The validation is the one of `GetLogsParamsSchema`, shared with the frontend; on top of it,
 * `fromDate` has to be a real ISO date. On success, `data` holds the query with `fromDate` as a
 * `Date` and `logCategories` as an array, empty when the client sent none. On failure, the
 * messages of `error.issues` are meant to be returned to the client as they are.
 *
 * ```ts
 * const parsedParams = safeParseGetLogsParams(request.query)
 * if (!parsedParams.success) {
 *   return reply.status(400).send({ statusCode: 400, message: parsedParams.error.issues[0].message })
 * }
 * const { fromDate, logCategories, logSearch } = parsedParams.data
 * ```
 */
export const safeParseGetLogsParams = (
  query: GetLogsParams
): z.ZodSafeParseResult<z.output<typeof ParsedGetLogsParamsSchema>> =>
  ParsedGetLogsParamsSchema.safeParse(query)

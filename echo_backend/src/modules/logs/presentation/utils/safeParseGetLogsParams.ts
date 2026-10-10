import type { GetLogsParams } from '@echo/utilities'
import { GetLogsParamsSchema, getInvalidDateFieldMessage } from '@echo/utilities'
import { z } from 'zod'

import { convertToDateFromISO } from '../../../../shared/utils/convertToDate.js'

/** Converts `value`, the date field `fieldName` of the query, to a `Date`, adding an issue to `context` when it is not an ISO date. */
const parseQueryDate = (value: string, fieldName: string, context: z.RefinementCtx): Date => {
  const date = convertToDateFromISO(value)

  if (!date) {
    context.addIssue({
      code: 'custom',
      message: getInvalidDateFieldMessage(fieldName)
    })
    return z.NEVER
  }

  return date
}

const ParsedGetLogsParamsSchema = GetLogsParamsSchema.extend({
  fromDate: GetLogsParamsSchema.shape.fromDate.transform((value, context) =>
    parseQueryDate(value, 'fromDate', context)
  ),
  toDate: GetLogsParamsSchema.shape.toDate.transform((value, context) =>
    value === undefined ? undefined : parseQueryDate(value, 'toDate', context)
  ),
  logCategories: GetLogsParamsSchema.shape.logCategories.transform((value) =>
    value ? [value].flat() : []
  )
})

/**
 * Validates the query of `GET /logs` and turns it into what `getFilteredLogs` needs.
 *
 * The validation is the one of `GetLogsParamsSchema`, shared with the frontend; on top of it,
 * `fromDate`, and `toDate` when it is given, have to be real ISO dates. On success, `data` holds
 * the query with `fromDate` and `toDate` as `Date`s and `logCategories` as an array, empty when the
 * client sent none. On failure, the
 * messages of `error.issues` are meant to be returned to the client as they are.
 *
 * ```ts
 * const parsedParams = safeParseGetLogsParams(request.query)
 * if (!parsedParams.success) {
 *   return reply.status(400).send({ statusCode: 400, message: parsedParams.error.issues[0].message })
 * }
 * const { fromDate, toDate, logCategories, logSearch } = parsedParams.data
 * ```
 */
export const safeParseGetLogsParams = (
  query: GetLogsParams
): z.ZodSafeParseResult<z.output<typeof ParsedGetLogsParamsSchema>> =>
  ParsedGetLogsParamsSchema.safeParse(query)

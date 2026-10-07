import { z } from 'zod'

import { LogCategory, LogCategorySchema } from './logCategory.schema.js'

const INVALID_FROM_DATE_MESSAGE = 'Field fromDate is not a valid date, it should be an ISO string'

/** Explains which value of `logCategories` is not a log category, and which ones can be used. */
const describeInvalidLogCategory = (logCategories: unknown): string => {
  const invalidLogCategory = [logCategories]
    .flat()
    .find((logCategory) => !LogCategorySchema.safeParse(logCategory).success)

  return `${invalidLogCategory} is not a valid log category, use ${Object.values(LogCategory).join('|')}`
}

/**
 * Runtime validation of the query of `GET /logs`, as the client sends it.
 *
 * It is the single source of truth of that query: the `GetLogsParams` type is derived from it, and
 * so is the schema of the route (see `logs.schemas.ts` in the backend), which then turns it into
 * what its service needs. The messages are returned to the client as they are.
 */
export const GetLogsParamsSchema = z.object({
  /** The logs emitted before this ISO 8601 date are left out. */
  fromDate: z
    .string({
      error: (issue) =>
        issue.input === undefined ? 'Missing required field: fromDate' : INVALID_FROM_DATE_MESSAGE
    })
    .meta({ format: 'date-time' }),
  /** The severities to keep: all of them when left out. */
  logCategories: z
    .union([LogCategorySchema, z.array(LogCategorySchema)], {
      error: (issue) => describeInvalidLogCategory(issue.input)
    })
    .optional(),
  /** The search typed by the user, in the syntax `parseLogSearchInput` reads. */
  logSearch: z.string().optional()
})

/** The query of `GET /logs`, as the client sends it. */
export type GetLogsParams = z.infer<typeof GetLogsParamsSchema>

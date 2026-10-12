import { z } from 'zod'

import { LogLevel, LogLevelSchema } from './logLevel.schema.js'

/**
 * Gives the message telling the client that `fieldName`, a date field of the query, is not an ISO
 * date.
 *
 * ```ts
 * getInvalidDateFieldMessage('fromDate') // 'Field fromDate is not a valid date, it should be an ISO string'
 * ```
 */
export const getInvalidDateFieldMessage = (fieldName: string): string =>
  `Field ${fieldName} is not a valid date, it should be an ISO string`

/** Explains which value of `logLevels` is not a log level, and which ones can be used. */
const describeInvalidLogLevel = (logLevels: unknown): string => {
  const invalidLogLevel = [logLevels]
    .flat()
    .find((logLevel) => !LogLevelSchema.safeParse(logLevel).success)

  return `${invalidLogLevel} is not a valid log level, use ${Object.values(LogLevel).join('|')}`
}

/**
 * Runtime validation of the query of `GET /logs`, as the client sends it.
 *
 * The `GetLogsParams` type is inferred from it. The messages of its errors are written for the
 * client, to be returned as they are. A date is only checked to be a text: `format: 'date-time'`
 * describes it in the JSON schema `z.toJSONSchema` gives, and whoever turns that text into a date
 * checks that it is one.
 *
 * ```ts
 * const result = GetLogsParamsSchema.safeParse({ logLevels: 'DEBUG' })
 * const [missingDateIssue, invalidLevelIssue] = result.error?.issues ?? []
 * missingDateIssue.message // 'Missing required field: fromDate'
 * invalidLevelIssue.message // 'DEBUG is not a valid log level, use SUCCESS|INFO|WARNING|ERROR'
 * ```
 */
export const GetLogsParamsSchema = z.object({
  /** The logs emitted before this ISO 8601 date are left out. */
  fromDate: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Missing required field: fromDate'
          : getInvalidDateFieldMessage('fromDate')
    })
    .meta({ format: 'date-time' }),
  /** The logs emitted at this ISO 8601 date or after are left out: none of them when left out. */
  toDate: z
    .string({ error: getInvalidDateFieldMessage('toDate') })
    .meta({ format: 'date-time' })
    .optional(),
  /** The severities to keep, one or several: all of them when left out. */
  logLevels: z
    .union([LogLevelSchema, z.array(LogLevelSchema)], {
      error: (issue) => describeInvalidLogLevel(issue.input)
    })
    .optional(),
  /** The search typed by the user, in the syntax `parseLogSearchInput` reads. */
  logSearch: z.string().optional()
})

/** The query of `GET /logs`, as the client sends it. */
export type GetLogsParams = z.infer<typeof GetLogsParamsSchema>

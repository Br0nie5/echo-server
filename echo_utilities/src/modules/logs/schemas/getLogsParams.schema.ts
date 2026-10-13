import { z } from 'zod'

import { getInvalidDateFieldMessage } from '../utils/getInvalidDateFieldMessage.js'

import { LogLevel, LogLevelSchema } from './logLevel.schema.js'

/**
 * Explains which value of `logLevels` is not a log level, and which ones can be used.
 *
 * `logLevels` is one value or a list of them. The value is written as it is when it is a text, and
 * as JSON otherwise, so a list or an object given in place of a level can be told from a text.
 */
const describeInvalidLogLevel = (logLevels: unknown): string => {
  const invalidLogLevel = (Array.isArray(logLevels) ? logLevels : [logLevels]).find(
    (logLevel) => !LogLevelSchema.safeParse(logLevel).success
  )
  const invalidLogLevelText =
    typeof invalidLogLevel === 'string' ? invalidLogLevel : JSON.stringify(invalidLogLevel)

  return `${invalidLogLevelText} is not a valid log level, use ${Object.values(LogLevel).join('|')}`
}

/**
 * Runtime validation of the query of `GET /logs`, as the client sends it.
 *
 * The `GetLogsParams` type is inferred from it. The messages of its errors are written for the
 * client, to be returned as they are. A date is only checked to be a text: `format: 'date-time'`
 * describes it in the JSON schema `z.toJSONSchema` gives, and whoever turns that text into a date
 * checks that it is one. The properties it does not describe are left out of what it parses.
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

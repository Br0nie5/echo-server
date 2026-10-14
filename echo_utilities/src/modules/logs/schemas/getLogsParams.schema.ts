import { z } from 'zod'

import { LogLevel, LogLevelSchema } from './logLevel.schema.js'
import { getInvalidDateFieldMessage } from './utils/getInvalidDateFieldMessage.js'

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
 * client, to be returned as they are. A date is an ISO 8601 date and time with its time zone, `Z`
 * or an offset (`2026-04-28T10:00:00.000Z`, `2026-04-28T12:00:00+02:00`), so `new Date` reads it
 * as the same instant everywhere: a date without a time or a time zone is refused. The properties
 * it does not describe are left out of what it parses.
 *
 * ```ts
 * const result = GetLogsParamsSchema.safeParse({ toDate: 'tomorrow', logLevels: 'DEBUG' })
 * const [missingDateIssue, invalidDateIssue, invalidLevelIssue] = result.error?.issues ?? []
 * missingDateIssue.message // 'Missing required field: fromDate'
 * invalidDateIssue.message // 'Field toDate is not a valid date, it should be an ISO string'
 * invalidLevelIssue.message // 'DEBUG is not a valid log level, use SUCCESS|INFO|WARNING|ERROR'
 * ```
 */
export const GetLogsParamsSchema = z.object({
  /** The logs emitted before this date are left out. */
  fromDate: z.iso.datetime({
    offset: true,
    error: (issue) =>
      issue.input === undefined
        ? 'Missing required field: fromDate'
        : getInvalidDateFieldMessage('fromDate')
  }),
  /** The logs emitted at this date or after are left out: none of them when left out. */
  toDate: z.iso.datetime({ offset: true, error: getInvalidDateFieldMessage('toDate') }).optional(),
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

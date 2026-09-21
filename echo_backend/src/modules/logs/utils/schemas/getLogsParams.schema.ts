import { isLogCategory, LogCategory, type LogCategory as LogCategoryType } from '@echo/utilities'
import { z } from 'zod'

import { convertToDateFromISO } from '../../../../shared/utils/convertToDate.js'

/** Validates and normalises the query of `GET /logs`. Messages are returned to the client as they are. */
export const GetLogsParamsSchema = z.object({
  fromDate: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Missing required field: fromDate'
          : 'Field fromDate is not a valid date, it should be an ISO string'
    })
    .transform((value, ctx) => {
      const date = convertToDateFromISO(value)

      if (!date) {
        ctx.addIssue({
          code: 'custom',
          message: 'Field fromDate is not a valid date, it should be an ISO string'
        })
        return z.NEVER
      }

      return date
    }),
  logCategories: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value, ctx): LogCategoryType[] => {
      const categories = value ? [value].flat() : []

      for (const category of categories) {
        if (!isLogCategory(category)) {
          ctx.addIssue({
            code: 'custom',
            message: `${category} is not a valid log category, use ${Object.values(LogCategory).join('|')}`
          })
          return z.NEVER
        }
      }

      return categories as LogCategoryType[]
    }),
  logSearch: z.string().optional()
})

/** The query of `GET /logs` once validated: `fromDate` is a `Date`, `logCategories` always an array. */
export type GetLogsParamsParsed = z.infer<typeof GetLogsParamsSchema>

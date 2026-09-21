import { z } from 'zod'

import type { Log } from '../types/__generated__/log.js'
import { LogCategory } from '../types/__generated__/logCategory.js'

/** Runtime validation of the generated types, used by the frontend to check API answers. */
export const LogCategorySchema = z.nativeEnum(LogCategory)

/** Runtime validation of the generated `Log` type. */
export const LogSchema: z.ZodType<Log> = z
  .object({
    id: z.string(),
    date: z.string(),
    groupName: z.string().optional(),
    fileName: z.string(),
    jobId: z.number().int(),
    category: LogCategorySchema,
    message: z.string()
  })
  .strict()

/** Runtime validation of the answer of `GET /logs`. */
export const LogArraySchema = z.array(LogSchema)

import { z } from 'zod'

import { LogCategorySchema } from './logCategory.schema.js'

/**
 * Runtime validation of one entry emitted by a watched script.
 *
 * It is the single source of truth of a log: the `Log` type is derived from it, and so is the schema
 * of the API (see `logs.schemas.ts` in the backend). The frontend checks the API answers with it.
 */
export const LogSchema = z.strictObject({
  /** Identifies the log among all the stored ones. */
  id: z.string(),
  /** When the log was emitted, as an ISO 8601 string. */
  date: z.string().meta({ format: 'date-time' }),
  /** The group of scripts the log belongs to, when it has one. */
  groupName: z.string().optional(),
  /** Where the log is stored, whatever the storage is: the path of a file, the address of another server... */
  location: z.string(),
  /** Short name of `location`, the one shown to the user: usually the name of the script the log comes from. */
  locationName: z.string(),
  /** The run of the script that emitted the log. */
  jobId: z.int(),
  /** The severity of the log. */
  category: LogCategorySchema,
  /** What the script reported, as it wrote it. */
  message: z.string(),
  /** File the log was emitted from. */
  callFile: z.string(),
  /** Line of `callFile` the log was emitted from. */
  callLine: z.int()
})

/** One entry emitted by a watched script. */
export type Log = z.infer<typeof LogSchema>

/** Runtime validation of the answer of `GET /logs`. */
export const LogArraySchema = z.array(LogSchema)

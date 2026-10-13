import { z } from 'zod'

import { LogLevelSchema } from './logLevel.schema.js'

/**
 * Runtime validation of a log, one entry of what was reported, wherever it is stored.
 *
 * The `Log` type is inferred from it. A log with a property it does not describe is refused.
 *
 * ```ts
 * const log = LogSchema.parse({
 *   id: 'log-id',
 *   date: '2026-04-28T10:00:00.000Z',
 *   location: '/storage/send_invoices',
 *   locationName: 'send_invoices',
 *   jobId: 66,
 *   level: 'INFO',
 *   message: 'Invoices sent.'
 * })
 * ```
 */
export const LogSchema = z.strictObject({
  /** Identifies the log among all the stored ones (see `createLogId`). */
  id: z.string(),
  /** When the log was emitted, as an ISO 8601 date and time in UTC, the way `Date.toISOString` writes it: any other text is refused. */
  date: z.iso.datetime(),
  /** The group the log belongs to, when it has one: usually a group of scripts. */
  groupName: z.string().optional(),
  /** Where the log is stored, whatever the storage is: the path of a file, the address of another server... */
  location: z.string(),
  /** Short name of `location`, the one shown to the user: usually the name of the script the log comes from. */
  locationName: z.string(),
  /** The run the log was emitted during: usually the one of a script. */
  jobId: z.int(),
  /** The severity of the log. */
  level: LogLevelSchema,
  /** What was reported, as it was written. */
  message: z.string(),
  /** Where the log was emitted from, in any form but an empty one, when it was said: `send_invoices.sh:12`. */
  origin: z.string().min(1).optional()
})

/** One entry of what was reported, wherever it is stored. */
export type Log = z.infer<typeof LogSchema>

/** Runtime validation of the answer of `GET /logs`. */
export const LogArraySchema = z.array(LogSchema)

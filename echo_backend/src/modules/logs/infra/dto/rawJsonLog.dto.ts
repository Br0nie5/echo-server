import type { Log } from '@echo/utilities'
import { z } from 'zod'

/**
 * Validates the shape of a `.jsonl` log line.
 *
 * Its `level` and `timestamp` are checked further when converting it to a `Log`. `origin` says
 * where the log was emitted from, in any form but an empty one, and may be left out.
 */
export const RawJsonLogLineSchema = z.object({
  jobId: z.number(),
  timestamp: z.string(),
  level: z.string(),
  message: z.string(),
  origin: z.string().min(1).optional()
})

/** The JSON a line of a `.jsonl` log file holds. */
type RawJsonLogLine = z.infer<typeof RawJsonLogLineSchema>

/**
 * Converts a log to the JSON its line holds in a log file.
 *
 * A line does not hold the `id`, the `contentId`, the `location`, the `locationName` nor the
 * `groupName` of the log: they are worked out again from the line and the file it is in when it
 * is read back.
 *
 * ```ts
 * const content = JSON.stringify(convertLogToRawJsonLogLine(log))
 * ```
 */
export const convertLogToRawJsonLogLine = ({
  date,
  jobId,
  level,
  message,
  origin
}: Log): RawJsonLogLine => ({
  jobId,
  timestamp: date,
  level,
  message,
  origin
})

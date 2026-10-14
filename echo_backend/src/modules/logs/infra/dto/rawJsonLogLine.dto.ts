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

import { z } from 'zod'

/** Validates the shape of a `.jsonl` log line. Its `status` and `timestamp` are checked further when converting it to a `Log`. `call_file`/`call_line` identify where the log was emitted from (file and line). */
export const RawJsonLogLineSchema = z.object({
  job_id: z.number(),
  timestamp: z.string(),
  status: z.string(),
  message: z.string(),
  call_file: z.string(),
  call_line: z.number().int()
})

/** A line of a `.jsonl` log file, before it is converted to a `Log`. */
export type RawJsonLogLine = z.infer<typeof RawJsonLogLineSchema>

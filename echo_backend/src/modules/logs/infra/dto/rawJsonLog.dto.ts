import type { Log } from '@echo/utilities'
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

/** The JSON a line of a `.jsonl` log file holds. */
type RawJsonLogLine = z.infer<typeof RawJsonLogLineSchema>

/**
 * Converts a log to the JSON its line holds in a log file.
 *
 * A line does not hold the `id`, the `location`, the `locationName` nor the `groupName` of the
 * log: they come from the file the line is in when it is read back.
 *
 * ```ts
 * const content = JSON.stringify(convertLogToRawJsonLogLine(log))
 * ```
 */
export const convertLogToRawJsonLogLine = ({
  date,
  jobId,
  category,
  message,
  callFile,
  callLine
}: Log): RawJsonLogLine => ({
  job_id: jobId,
  timestamp: date,
  status: category,
  message,
  call_file: callFile,
  call_line: callLine
})

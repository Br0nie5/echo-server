import type { RawJsonLogLine } from '../../../../infra/dto/rawJsonLog.dto.js'
import type { SelfLog } from '../../domain/selfLog.js'

/**
 * Converts a self log to the JSON its line holds in a self-log file.
 *
 * It is the JSON of any `.jsonl` log line, so the self logs are read back like the other logs.
 * `jobId` and `date` are what the self log itself does not carry: the job it was reported during
 * and when it was reported.
 */
export const convertSelfLogToRawJsonLogLine = (
  { category, message, callFile, callLine }: SelfLog,
  jobId: number,
  date: Date
): RawJsonLogLine => ({
  job_id: jobId,
  timestamp: date.toISOString(),
  status: category,
  message,
  call_file: callFile,
  call_line: callLine
})

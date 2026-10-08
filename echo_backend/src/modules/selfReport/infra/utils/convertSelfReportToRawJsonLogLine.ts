import { LogCategory } from '@echo/utilities'

import type { RawJsonLogLine } from '../../../logs/infra/dto/rawJsonLog.dto.js'
import type { SelfReport } from '../../domain/selfReport.js'

/** The `status` a self report of each level is written with in a self-report file. */
const STATUS_BY_SELF_REPORT_LEVEL: Record<SelfReport['level'], LogCategory> = {
  warning: LogCategory.WARNING,
  error: LogCategory.ERROR
}

/**
 * Converts a self report to the JSON its line holds in a self-report file.
 *
 * It is the JSON of any `.jsonl` log line, so the self reports are read back like the logs: the
 * level becomes the `status`, and `reportedFile` and `reportedLine` the `call_file` and
 * `call_line`. `jobId` is what the self report itself does not carry: the job it was reported
 * during.
 */
export const convertSelfReportToRawJsonLogLine = (
  { date, message, level, reportedFile, reportedLine }: SelfReport,
  jobId: number
): RawJsonLogLine => ({
  job_id: jobId,
  timestamp: date.toISOString(),
  status: STATUS_BY_SELF_REPORT_LEVEL[level],
  message,
  call_file: reportedFile,
  call_line: reportedLine
})

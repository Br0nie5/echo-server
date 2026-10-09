import { isLogCategory, type Log } from '@echo/utilities'

import { convertToDateFromISO } from '../../../../shared/utils/convertToDate.js'

import type { LogFileDto } from './logFile.dto.js'
import { RawJsonLogLineSchema } from './rawJsonLog.dto.js'

/** A line of a log file as it is stored, before it is known to hold a valid log. */
export interface RawLogLineDto {
  logFile: LogFileDto
  /** Position of the line among the non-blank lines of its file, starting at 0. */
  index: number
  /** The text of the line, expected to be the JSON `RawJsonLogLineSchema` describes. */
  content: string
}

/**
 * Converts a stored line to the `Log` it holds.
 *
 * Returns `undefined` when the line does not hold a log: its content is not JSON, does not have
 * the shape `RawJsonLogLineSchema` describes, has an unknown status or a timestamp that is not a date.
 *
 * ```ts
 * const logs = rawLogLines.map(convertRawLogLineToLog).filter((log) => log !== undefined)
 * ```
 */
export const convertRawLogLineToLog = ({
  logFile,
  index,
  content
}: RawLogLineDto): Log | undefined => {
  let json: unknown

  try {
    json = JSON.parse(content)
  } catch {
    return
  }

  const rawJsonLogLine = RawJsonLogLineSchema.safeParse(json)

  if (!rawJsonLogLine.success) {
    return
  }

  const { job_id, timestamp, status, message, call_file, call_line } = rawJsonLogLine.data
  const date = convertToDateFromISO(timestamp)?.toISOString()

  if (!isLogCategory(status) || !date) {
    return
  }

  return {
    id: `${index} [${logFile.groupName}] [${logFile.fileName}] ${content}`,
    date,
    groupName: logFile.groupName,
    location: logFile.path,
    locationName: logFile.fileName,
    jobId: job_id,
    category: status,
    message,
    callFile: call_file,
    callLine: call_line
  }
}

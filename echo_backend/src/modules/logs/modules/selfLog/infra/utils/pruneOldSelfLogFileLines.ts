import { convertToDateFromISO } from '../../../../../../shared/utils/convertToDate.js'
import type { SelfFileLogApi } from '../selfFileLog.api.js'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Whether the self log of `rawSelfLogLine` was written at `retentionTime` or after.
 *
 * A line whose date cannot be read is kept, so an unrelated bug cannot silently lose data.
 */
const isRawSelfLogLineValid = (rawSelfLogLine: string, retentionTime: number): boolean => {
  try {
    const { timestamp } = JSON.parse(rawSelfLogLine)
    const date = convertToDateFromISO(timestamp)

    return date === undefined || date.getTime() >= retentionTime
  } catch {
    return true
  }
}

/**
 * Removes from the self-log file named `selfLogFileName` the lines of the self logs older than
 * `retentionDays`.
 *
 * The file is read and written through `selfFileLogApi`, and left untouched when it has no such
 * line. Throws when the file cannot be read or written.
 */
export const pruneOldSelfLogFileLines = async (
  selfFileLogApi: SelfFileLogApi,
  selfLogFileName: string,
  retentionDays: number
): Promise<void> => {
  const rawSelfLogLines = await selfFileLogApi.getRawSelfLogLines(selfLogFileName)
  const retentionTime = Date.now() - retentionDays * MILLISECONDS_PER_DAY
  const validRawSelfLogLines = rawSelfLogLines.filter((rawSelfLogLine) =>
    isRawSelfLogLineValid(rawSelfLogLine, retentionTime)
  )

  if (validRawSelfLogLines.length < rawSelfLogLines.length) {
    await selfFileLogApi.replaceRawSelfLogLines(selfLogFileName, validRawSelfLogLines)
  }
}

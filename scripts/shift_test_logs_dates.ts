/**
 * Moves the logs of `test_logs/` in time, so that they stay within the dates the app shows.
 *
 * Every date moves by the same amount, which keeps the time between two logs, and the newest log
 * lands on the date given as the first argument, or on the current time without one. A line that
 * holds no valid log is left as it is, as is everything but the `timestamp` of the others.
 *
 * Node.js runs this file as it is, removing its types itself, so it holds only syntax it can
 * remove (no enum, no namespace).
 *
 * ```bash
 * npm run test-logs:shift                                  # the newest log is now
 * npm run test-logs:shift -- 2026-11-01                    # at midnight UTC on that day
 * npm run test-logs:shift -- 2026-11-01T12:30:00.000+02:00
 * ```
 *
 * It throws when the date is not an ISO one or when no log holds a valid date, without writing
 * anything. It overwrites the files, and `test_logs/` is not versioned: nothing can undo it, but
 * running it again with another date.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const LOGS_DIR_PATH = path.join(import.meta.dirname, '..', 'test_logs')
const LOG_FILE_EXTENSION = '.jsonl'
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T.+)?$/
const TIMESTAMP_PATTERN = /("timestamp"\s*:\s*")[^"]*(")/
const MILLISECONDS_IN_AN_HOUR = 3_600_000

/** Gives the time `targetDate` stands for, the current one when it is `undefined`. */
const parseTargetTime = (targetDate: string | undefined): number => {
  if (targetDate === undefined) {
    return Date.now()
  }
  const targetTime = ISO_DATE_PATTERN.test(targetDate) ? Date.parse(targetDate) : NaN
  if (Number.isNaN(targetTime)) {
    throw new Error(`The date must be an ISO one, such as 2026-11-01: ${targetDate}`)
  }
  return targetTime
}

/** Gives the time of the log `line` holds, `NaN` when it holds no valid log. */
const readLogTime = (line: string): number => {
  try {
    const { timestamp }: { timestamp?: unknown } = JSON.parse(line)
    return typeof timestamp === 'string' ? Date.parse(timestamp) : NaN
  } catch {
    return NaN
  }
}

const logFilesPaths = readdirSync(LOGS_DIR_PATH, { recursive: true, encoding: 'utf8' })
  .filter((filePath) => filePath.endsWith(LOG_FILE_EXTENSION))
  .map((filePath) => path.join(LOGS_DIR_PATH, filePath))

const logFiles = logFilesPaths.map((filePath) => ({
  filePath,
  lines: readFileSync(filePath, 'utf8').split('\n')
}))

const logTimes = logFiles
  .flatMap(({ lines }) => lines.map(readLogTime))
  .filter((logTime) => !Number.isNaN(logTime))

if (logTimes.length === 0) {
  throw new Error(`No log holds a valid date in ${LOGS_DIR_PATH}`)
}

const newestLogTime = logTimes.reduce((newestTime, logTime) => Math.max(newestTime, logTime))
const targetTime = parseTargetTime(process.argv[2])
const shift = targetTime - newestLogTime

for (const { filePath, lines } of logFiles) {
  const shiftedLines = lines.map((line) => {
    const logTime = readLogTime(line)
    if (Number.isNaN(logTime)) {
      return line
    }
    const shiftedDate = new Date(logTime + shift).toISOString()
    return line.replace(TIMESTAMP_PATTERN, `$1${shiftedDate}$2`)
  })
  writeFileSync(filePath, shiftedLines.join('\n'))
}

const shiftHours = (shift / MILLISECONDS_IN_AN_HOUR).toFixed(2)
console.log(
  `Moved ${logTimes.length} logs by ${shiftHours} hours: ` +
    `the newest is at ${new Date(targetTime).toISOString()}`
)

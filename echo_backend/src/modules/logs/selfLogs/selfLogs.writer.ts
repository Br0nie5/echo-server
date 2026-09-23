import fs from 'node:fs/promises'
import path from 'node:path'

import { LogCategory } from '@echo/utilities'
import type { FastifyBaseLogger } from 'fastify'

import { convertToDateFromISO, formatDateForLog } from '../../../shared/utils/convertToDate.js'
import type { RawJsonLogLine } from '../utils/schemas/rawJsonLogLine.schema.js'

import { sanitizeServerNameForPath } from './utils/sanitizeServerNameForPath.js'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** A raw line that failed to parse, at `lineIndex` (1-based, among the non-blank lines of its file) of the file it came from. */
export interface FailedLogLine {
  rawLogLine: string
  lineIndex: number
}

/** Writes the backend's own diagnostics (currently: log lines it failed to parse) to `.jsonl` files, so they surface in the UI like any other log. */
export interface SelfLogsWriter {
  /** Whether `filePath` is one of this writer's own self-log files. Callers use this to avoid re-reporting parse failures found while reading a self-log back into itself. */
  isSelfLogFile: (filePath: string) => boolean
  /**
   * Appends one WARNING entry per failed line to `<selfLogsDir>/<selfLogFileName>`, batched into a
   * single write. `sourceFileName` (the file the failures came from) is written as `call_file`
   * alongside each entry's `call_line`, and used together with the raw line as a dedup key: a
   * failure already reported (same `call_file`, `call_line` and raw line) as of the last read of
   * the target file is skipped, so re-parsing an unchanged file on every request does not keep
   * appending the same failure. Never throws.
   */
  logParseFailures: (
    failedLines: FailedLogLine[],
    selfLogFileName: string,
    sourceFileName: string
  ) => Promise<void>
}

/** A writer that does nothing, used when self logs are disabled. */
export const createNoopSelfLogsWriter = (): SelfLogsWriter => ({
  isSelfLogFile: (): boolean => false,
  logParseFailures: async (): Promise<void> => {}
})

/** Dependencies of {@link createSelfLogsWriter}. */
export interface CreateSelfLogsWriterOptions {
  logsDirPath: string
  serverName: string
  retentionDays: number
  sessionJobId: number
  logger: FastifyBaseLogger
}

/** Keeps only the lines of `content` timestamped within `retentionDays`. A line that can't be read as a timestamped self-log entry is kept, so an unrelated bug can't silently lose data. */
const pruneOldLines = (content: string, retentionDays: number): string[] => {
  const cutoff = Date.now() - retentionDays * MS_PER_DAY

  return content
    .split('\n')
    .filter((line) => line.trim() !== '')
    .filter((line) => {
      try {
        const { timestamp } = JSON.parse(line)
        const date = convertToDateFromISO(timestamp)

        return date === undefined || date.getTime() >= cutoff
      } catch {
        return true
      }
    })
}

/** Identifies a self-log entry regardless of when it was written, so a re-parsed failure can be recognized as already reported. */
const failureKey = (callFile: string, callLine: number, message: string): string =>
  JSON.stringify([callFile, callLine, message])

/** The dedupe keys of every entry already in `content`, ignoring lines that are not self-log entries (e.g. a stray malformed line). */
const readReportedFailureKeys = (content: string): Set<string> =>
  new Set(
    content
      .split('\n')
      .filter((line) => line.trim() !== '')
      .flatMap((line) => {
        try {
          const { call_file, call_line, message } = JSON.parse(line)
          return typeof call_file === 'string' && typeof call_line === 'number'
            ? [failureKey(call_file, call_line, message)]
            : []
        } catch {
          return []
        }
      })
  )

/** Prunes every `.jsonl` file already in `selfLogsDir`, dropping lines older than `retentionDays`. */
const pruneExistingSelfLogFiles = async (
  selfLogsDir: string,
  retentionDays: number
): Promise<void> => {
  const entries = await fs.readdir(selfLogsDir)
  const jsonlFileNames = entries.filter((entry) => entry.endsWith('.jsonl'))

  await Promise.all(
    jsonlFileNames.map(async (fileName) => {
      const filePath = path.join(selfLogsDir, fileName)
      const existingContent = await fs.readFile(filePath, 'utf-8')
      const survivingLines = pruneOldLines(existingContent, retentionDays)

      await fs.writeFile(
        filePath,
        survivingLines.length > 0 ? `${survivingLines.join('\n')}\n` : '',
        'utf-8'
      )
    })
  )
}

/**
 * Builds the self-logs writer: computes the self-logs directory under `logsDirPath`, creates it and
 * prunes every `.jsonl` file already in it once. Falls back to a no-op writer (logging why via
 * `logger`) rather than throwing, so a misconfigured optional feature never blocks server startup.
 */
export const createSelfLogsWriter = async ({
  logsDirPath,
  serverName,
  retentionDays,
  sessionJobId,
  logger
}: CreateSelfLogsWriterOptions): Promise<SelfLogsWriter> => {
  const selfLogsDir = path.join(logsDirPath, 'server', sanitizeServerNameForPath(serverName), 'log')

  try {
    await fs.mkdir(selfLogsDir, { recursive: true })
    await pruneExistingSelfLogFiles(selfLogsDir, retentionDays)
  } catch (err) {
    logger.error({ err }, 'Failed to set up self logs, disabling them for this session')
    return createNoopSelfLogsWriter()
  }

  return {
    isSelfLogFile: (filePath): boolean => path.dirname(filePath) === selfLogsDir,

    logParseFailures: async (failedLines, selfLogFileName, sourceFileName): Promise<void> => {
      if (failedLines.length === 0) {
        return
      }

      const filePath = path.join(selfLogsDir, selfLogFileName)

      try {
        const existingContent = await fs.readFile(filePath, 'utf-8').catch(() => '')
        const alreadyReported = readReportedFailureKeys(existingContent)

        const newFailures = failedLines.filter(
          ({ rawLogLine, lineIndex }) =>
            !alreadyReported.has(failureKey(sourceFileName, lineIndex, rawLogLine))
        )

        if (newFailures.length === 0) {
          return
        }

        const rawLines = newFailures.map(({ rawLogLine, lineIndex }) => {
          const rawJsonLogLine: RawJsonLogLine = {
            job_id: sessionJobId,
            timestamp: formatDateForLog(),
            status: LogCategory.WARNING,
            message: rawLogLine,
            call_file: sourceFileName,
            call_line: lineIndex
          }

          return JSON.stringify(rawJsonLogLine)
        })

        await fs.appendFile(filePath, `${rawLines.join('\n')}\n`, 'utf-8')
      } catch (err) {
        logger.error({ err, sourceFileName }, 'Failed to write self logs')
      }
    }
  }
}

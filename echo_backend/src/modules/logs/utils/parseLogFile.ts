import { isLogCategory, type Log } from '@echo/utilities'

import type { FilesService } from '../../../shared/services/files.service.js'
import { convertToDateFromISO } from '../../../shared/utils/convertToDate.js'
import type { FailedLogLine, SelfLogsWriter } from '../selfLogs/selfLogs.writer.js'

import { getDirectoriesLinkedName } from './getDirectoriesLinkedName.js'
import { RawJsonLogLineSchema } from './schemas/rawJsonLogLine.schema.js'

/** Name of the file `parseLogFile` reports its own parse failures to, under the self-logs directory. */
const SELF_LOG_FILE_NAME = 'parseLogFile.jsonl'

/** Where a raw log line comes from: its position in the file, the file and the group it is in. */
interface ParseRawLogLineProps {
  rawLogLine: string
  rawLogIndex: number
  groupName: string | undefined
  fileName: string
}

/** Parses one `.jsonl` line into a `Log`, or `undefined` if it is not JSON, has an unexpected shape, an unknown status or an unparsable timestamp. */
export const parseRawLogLine = ({
  rawLogLine,
  groupName,
  fileName,
  rawLogIndex
}: ParseRawLogLineProps): Log | undefined => {
  const id = `${rawLogIndex} [${groupName}] [${fileName}] ${rawLogLine}`

  let parsed: unknown

  try {
    parsed = JSON.parse(rawLogLine)
  } catch {
    return
  }

  const rawJsonLogLine = RawJsonLogLineSchema.safeParse(parsed)

  if (!rawJsonLogLine.success) {
    return
  }

  const jobId = rawJsonLogLine.data.job_id
  const date = convertToDateFromISO(rawJsonLogLine.data.timestamp)?.toISOString()
  const category = isLogCategory(rawJsonLogLine.data.status)
    ? rawJsonLogLine.data.status
    : undefined
  const message = rawJsonLogLine.data.message
  const callFile = rawJsonLogLine.data.call_file
  const callLine = rawJsonLogLine.data.call_line

  if (!category) {
    return
  }

  if (!date) {
    return
  }

  return { id, date, groupName, fileName, jobId, category, message, callFile, callLine }
}

interface ParseRawLogsProps {
  rawLogs: string[]
  fileName: string
  groupName: string | undefined
}

/** The parsed logs, plus the raw lines that could not be parsed (so callers can report them). */
export interface ParseRawLogsResult {
  logs: Log[]
  failedLines: FailedLogLine[]
}

/** Parses every line, separating the valid ones from the raw lines that failed to parse. */
export const parseRawLogs = ({
  rawLogs,
  fileName,
  groupName
}: ParseRawLogsProps): ParseRawLogsResult => {
  const logs: Log[] = []
  const failedLines: FailedLogLine[] = []

  rawLogs.forEach((rawLogLine, rawLogIndex) => {
    const log = parseRawLogLine({ rawLogLine, rawLogIndex, groupName, fileName })

    if (log === undefined) {
      failedLines.push({ rawLogLine, lineIndex: rawLogIndex + 1 })
    } else {
      logs.push(log)
    }
  })

  return { logs, failedLines }
}

/**
 * Reads a `.jsonl` file into logs. The group is derived from its location under `baseLogDirectoryPath`.
 * Lines that fail to parse are reported to `selfLogsWriter`, unless this file already lives in the
 * self-logs directory (writing failures about a self-log back into the self-logs would be a feedback loop).
 */
export const parseLogFile = async (
  logFilePath: string,
  baseLogDirectoryPath: string,
  filesService: FilesService,
  selfLogsWriter: SelfLogsWriter
): Promise<Log[]> => {
  const rawLogs = await filesService.readFile(logFilePath)

  const fileName = filesService.getFileNameWithoutExtension(logFilePath)

  const groupName = getDirectoriesLinkedName(logFilePath.replace(`${baseLogDirectoryPath}/`, ''))

  const { logs, failedLines } = parseRawLogs({
    rawLogs,
    fileName,
    groupName
  })

  if (!selfLogsWriter.isSelfLogFile(logFilePath)) {
    await selfLogsWriter.logParseFailures(failedLines, SELF_LOG_FILE_NAME, fileName)
  }

  return logs
}

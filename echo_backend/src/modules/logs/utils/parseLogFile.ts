import { isLogCategory, type Log } from '@echo/utilities'

import type { FilesService } from '../../../shared/services/files.service.js'
import { convertToDateFromFormat } from '../../../shared/utils/convertToDate.js'

import { getDirectoriesLinkedName } from './getDirectoriesLinkedName.js'
import { RawJsonLogLineSchema } from './schemas/rawJsonLogLine.schema.js'

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
  const date = convertToDateFromFormat(rawJsonLogLine.data.timestamp)?.toISOString()
  const category = isLogCategory(rawJsonLogLine.data.status)
    ? rawJsonLogLine.data.status
    : undefined
  const message = rawJsonLogLine.data.message

  if (!category) {
    return
  }

  if (!date) {
    return
  }

  return { id, date, groupName, fileName, jobId, category, message }
}

interface ParseRawLogsProps {
  rawLogs: string[]
  fileName: string
  groupName: string | undefined
}

/** Parses every line, silently dropping the invalid ones. */
export const parseRawLogs = ({ rawLogs, fileName, groupName }: ParseRawLogsProps): Log[] => {
  const logs = rawLogs
    .map((rawLogLine, rawLogIndex) =>
      parseRawLogLine({ rawLogLine, rawLogIndex, groupName, fileName })
    )
    .filter((fullLogEntry) => fullLogEntry !== undefined)

  return logs
}

/** Reads a `.jsonl` file into logs. The group is derived from its location under `baseLogDirectoryPath`. */
export const parseLogFile = async (
  logFilePath: string,
  baseLogDirectoryPath: string,
  filesService: FilesService
): Promise<Log[]> => {
  const rawLogs = await filesService.readFile(logFilePath)

  const fileName = filesService.getFileNameWithoutExtension(logFilePath)

  const groupName = getDirectoriesLinkedName(logFilePath.replace(`${baseLogDirectoryPath}/`, ''))

  return parseRawLogs({
    rawLogs,
    fileName,
    groupName
  })
}

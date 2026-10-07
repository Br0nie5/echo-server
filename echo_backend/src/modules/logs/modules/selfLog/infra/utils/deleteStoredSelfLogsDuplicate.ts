import type { SelfLog } from '../../domain/selfLog.js'
import type { SelfFileLogApi } from '../selfFileLog.api.js'

/** Identifies a self log whenever it was written, so one reported again is recognized as already stored. */
const getSelfLogKey = (callFile: string, callLine: number, message: string): string =>
  JSON.stringify([callFile, callLine, message])

/** The key of the self log `rawSelfLogLine` holds, or `undefined` when it holds none. */
const getRawSelfLogLineKey = (rawSelfLogLine: string): string | undefined => {
  try {
    const { call_file, call_line, message } = JSON.parse(rawSelfLogLine)

    return typeof call_file === 'string' && typeof call_line === 'number'
      ? getSelfLogKey(call_file, call_line, message)
      : undefined
  } catch {
    return undefined
  }
}

/**
 * Deletes from the self-log file named `selfLogFileName` the lines that hold one of `selfLogs`.
 *
 * A line holds a self log when it has the same `callFile`, `callLine` and `message`, whatever its
 * date and its job. It is called before `selfLogs` are appended to the file, so a self log saved
 * again ends up stored once, with its new date. Throws when the file cannot be read or written.
 */
export const deleteStoredSelfLogsDuplicate = async (
  selfFileLogApi: SelfFileLogApi,
  selfLogFileName: string,
  selfLogs: SelfLog[]
): Promise<void> => {
  const selfLogKeys = new Set<string | undefined>(
    selfLogs.map(({ callFile, callLine, message }) => getSelfLogKey(callFile, callLine, message))
  )
  const storedRawSelfLogLines = await selfFileLogApi.getRawSelfLogLines(selfLogFileName)

  await selfFileLogApi.deleteRawSelfLogLines(
    selfLogFileName,
    storedRawSelfLogLines.filter((rawSelfLogLine) =>
      selfLogKeys.has(getRawSelfLogLineKey(rawSelfLogLine))
    )
  )
}

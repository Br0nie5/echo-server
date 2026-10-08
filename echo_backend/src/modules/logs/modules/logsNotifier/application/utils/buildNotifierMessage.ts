import type { Log } from '@echo/utilities'
import { DateTime } from 'luxon'

/** One line of the message: `[jobId] [date UTC±offset] [category] - fileName > message`, the date shown in `timezone`. */
export function formatLogLine(log: Log, timezone: string): string {
  const date = DateTime.fromISO(log.date).setZone(timezone)
  const offsetLabel = date.offset === 0 ? 'UTC' : `UTC${date.toFormat('Z')}`

  return (
    `[${log.jobId}] [${date.toFormat('yyyy-MM-dd HH:mm:ss')} ${offsetLabel}]` +
    ` [${log.category}] - ${log.fileName} > ${log.message}`
  )
}

/** What {@link buildNotifierMessage} needs. */
export interface NotifierMessageContent {
  /** Maximum length of the message, given by the channel it is sent through. */
  messageSizeLimit: number
  problemLogs: Log[]
  /** Name the message says the logs come from. */
  deviceName: string
  /** Luxon zone the dates of the logs are shown in. */
  timezone: string
}

/**
 * Builds the message telling about `problemLogs`, never longer than `messageSizeLimit`.
 *
 * The message lists the logs, in order, under a header naming `deviceName`. The logs that do not
 * fit are replaced by a footer counting them. When not even the first log fits, the message only
 * says how many logs there are.
 *
 * Returns `undefined` when there is nothing to say, that is no log, or when `messageSizeLimit` is
 * too small for the shortest of these messages.
 *
 * ```ts
 * const message = buildNotifierMessage({
 *   messageSizeLimit: notifier.getMessageSizeLimit(),
 *   problemLogs,
 *   deviceName,
 *   timezone
 * })
 * ```
 */
export function buildNotifierMessage({
  messageSizeLimit,
  problemLogs,
  deviceName,
  timezone
}: NotifierMessageContent): string | undefined {
  if (problemLogs.length === 0) {
    return undefined
  }

  const lines = problemLogs.map((log) => formatLogLine(log, timezone))
  const header = `Logs from device ${deviceName}:\n\n\n`

  const buildMessageListingLogs = (listedLogsCount: number): string => {
    const otherLogsCount = lines.length - listedLogsCount
    const footer =
      otherLogsCount > 0 ? `\n\n\n${otherLogsCount} other logs to see inside the console` : ''

    return `${header}${lines.slice(0, listedLogsCount).join('\n\n')}${footer}`
  }

  let message = `${lines.length} logs from device ${deviceName} to see inside the console`

  if (message.length > messageSizeLimit) {
    return undefined
  }

  for (let listedLogsCount = 1; listedLogsCount <= lines.length; listedLogsCount++) {
    const messageListingLogs = buildMessageListingLogs(listedLogsCount)

    if (messageListingLogs.length > messageSizeLimit) {
      break
    }

    message = messageListingLogs
  }

  return message
}

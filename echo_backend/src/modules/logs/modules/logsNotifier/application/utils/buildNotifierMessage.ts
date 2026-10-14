import type { Log } from '@echo/utilities'
import { DateTime } from 'luxon'

/**
 * One line of the message: `[jobId] [date UTC±offset] [level] - locationName > message`, the date
 * shown in `timezone`.
 */
const formatLogLine = (log: Log, timezone: string): string => {
  const date = DateTime.fromISO(log.date).setZone(timezone)
  const offsetLabel = date.offset === 0 ? 'UTC' : `UTC${date.toFormat('Z')}`

  return (
    `[${log.jobId}] [${date.toFormat('yyyy-MM-dd HH:mm:ss')} ${offsetLabel}]` +
    ` [${log.level}] - ${log.locationName} > ${log.message}`
  )
}

/** The word naming `count` logs: `log` when it is 1, `logs` otherwise. */
const pluralizeLog = (count: number): string => (count === 1 ? 'log' : 'logs')

/** What {@link buildNotifierMessage} needs. */
export interface NotifierMessageContent {
  /** Maximum length of the message, given by the channel it is sent through. */
  messageSizeLimit: number
  /** Logs the message tells about, in the order it lists them. */
  watchedLogs: Log[]
  /** Name the message says the logs come from. */
  serverName: string
  /** Luxon zone the dates of the logs are shown in. */
  timezone: string
}

/**
 * Builds the message telling about `watchedLogs`, never longer than `messageSizeLimit`.
 *
 * The message lists the logs, in order, under a header naming `serverName`, one line each:
 * `[jobId] [date UTC±offset] [level] - locationName > message`, the date shown in `timezone`. The
 * logs that do not fit are replaced by a footer counting them. When not even the first log fits,
 * the message only says how many logs there are.
 *
 * Throws when `messageSizeLimit` is too small for the shortest of these messages, the one counting
 * the logs.
 *
 * ```ts
 * const message = buildNotifierMessage({
 *   messageSizeLimit: 4096,
 *   watchedLogs,
 *   serverName,
 *   timezone
 * })
 * ```
 */
export const buildNotifierMessage = ({
  messageSizeLimit,
  watchedLogs,
  serverName,
  timezone
}: NotifierMessageContent): string => {
  const lines = watchedLogs.map((log) => formatLogLine(log, timezone))
  const header = `Logs from server ${serverName}:\n\n\n`

  const buildMessageListingLogs = (listedLogsCount: number): string => {
    const otherLogsCount = lines.length - listedLogsCount
    const footer =
      otherLogsCount > 0
        ? `\n\n\n${otherLogsCount} other ${pluralizeLog(otherLogsCount)} to see inside the app`
        : ''

    return `${header}${lines.slice(0, listedLogsCount).join('\n\n')}${footer}`
  }

  let message =
    `${lines.length} ${pluralizeLog(lines.length)} from server ${serverName} ` +
    'to see inside the app'

  if (message.length > messageSizeLimit) {
    throw new Error(
      `The message telling about the watched logs cannot be built: its size limit of ` +
        `${messageSizeLimit} characters is too small for any message`
    )
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

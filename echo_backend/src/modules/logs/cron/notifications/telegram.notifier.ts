import type { Log } from '@echo/utilities'

import type { LogsCronOptions } from '../../../../shared/types/echoBackEnv.js'

import type { LogsNotifier } from './logs.notifier.js'

/** Maximum length of a Telegram message. */
const TELEGRAM_LIMIT = 4096
/** Fixed offset applied to the dates of the messages (no daylight saving handling). */
const DISPLAY_UTC_OFFSET_HOURS = 2

/** One line of the message: `[jobId] [date GMT+offset] [category] - fileName > message`. */
export function formatLogLine(log: Log): string {
  const date = new Date(log.date)
  const shifted = new Date(date.getTime() + DISPLAY_UTC_OFFSET_HOURS * 60 * 60 * 1000)
  const formattedDate = shifted.toISOString().replace('T', ' ').substring(0, 19)

  return (
    `[${log.jobId}] [${formattedDate} GMT+${DISPLAY_UTC_OFFSET_HOURS}]` +
    ` [${log.category}] - ${log.fileName} > ${log.message}`
  )
}

/**
 * Builds the message listing the logs, in order, as long as it fits in `TELEGRAM_LIMIT`.
 * Logs that do not fit are replaced by a footer counting them.
 */
export function buildTelegramMessage(problemLogs: Log[], deviceName: string): string {
  const lines = problemLogs.map(formatLogLine)
  const totalLogs = lines.length

  const getOtherLogsFooterMessage = (remaining: number): string => {
    return remaining > 0 ? `\n\n\n${remaining} other logs to see inside the console` : ''
  }

  let message = `Logs from device ${deviceName}:\n\n\n`
  let includedCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    includedCount++

    const testMessage = includedCount === 1 ? `${message}${line}` : `${message}\n\n${line}`
    const remaining = totalLogs - includedCount
    const footer = getOtherLogsFooterMessage(remaining)
    const testMessageWithFooter = testMessage + footer

    if (testMessageWithFooter.length > TELEGRAM_LIMIT) {
      const remainingAfterStop = totalLogs - (includedCount - 1)
      message = `${message}${getOtherLogsFooterMessage(remainingAfterStop)}`
      includedCount--
      break
    }

    message = testMessage
  }

  return message
}

/** Sends the problem logs as a Telegram message from the bot behind `TELEGRAM_BASE_URL`. */
export const createTelegramNotifier = (
  logsCronOptions: LogsCronOptions,
  deviceName: string
): LogsNotifier => ({
  notify: async (problemLogs: Log[]): Promise<void> => {
    if (problemLogs.length === 0) {
      return
    }

    const message = buildTelegramMessage(problemLogs, deviceName)

    const url = `${logsCronOptions.TELEGRAM_BASE_URL}/sendMessage`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: logsCronOptions.TELEGRAM_CHAT_ID, text: message })
    })

    if (!res.ok) {
      throw new Error(`Telegram API error: ${res.status}`)
    }
  }
})

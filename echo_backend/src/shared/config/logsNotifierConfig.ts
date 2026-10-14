import type { LogLevel } from '@echo/utilities'

/**
 * What the cron notifying the watched logs is configured with: when it runs, what it looks for and
 * how its messages read.
 *
 * It holds nothing of the channel the messages go through, nor of where the date of the last
 * check is stored.
 */
export type LogsNotifierConfig = {
  /** Cron expression saying when the logs are checked (`LOGS_NOTIFIER_SCHEDULE`). */
  schedule: string
  /** Levels of the logs that are notified (`LOGS_NOTIFIER_WATCHED_LOGS_LEVELS`). */
  watchedLogsLevels: LogLevel[]
  /**
   * Zone the `schedule` is read in and the dates of the messages are shown in
   * (`LOGS_NOTIFIER_TIMEZONE`): an IANA zone (`Europe/Paris`), `UTC` or an offset (`+02:00`).
   */
  timezone: string
  /** Name the messages say the logs come from (`SERVER_NAME`). */
  serverName: string
}

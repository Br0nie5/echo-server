import type { Log } from '@echo/utilities'

/** Where the problem logs found by the cron are sent (Telegram, e-mail, ...). */
export interface LogsNotifier {
  notify: (logs: Log[]) => Promise<void>
}

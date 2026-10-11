import type { Log } from '@echo/utilities'

import type { SelfReport } from '../../domain/selfReport.js'

/**
 * What a log says that a self report does not carry: everything of a `Log` that
 * {@link convertSelfReportToLog} does not work out from the self report itself.
 */
export type SelfReportLogContext = Omit<Log, 'id' | 'date' | 'category' | 'message' | 'origin'>

/**
 * Converts a self report to the log it is stored as.
 *
 * The `id`, the `message` and the `origin` are kept, and the level is the category, as both are
 * named the same. `context` gives the rest: the job the self report was reported during, and where
 * it is stored.
 */
export const convertSelfReportToLog = (
  { id, date, message, level, origin }: SelfReport,
  context: SelfReportLogContext
): Log => ({
  ...context,
  id,
  date: date.toISOString(),
  category: level,
  message,
  origin
})

import { createLogWithIds, type Log } from '@echo/utilities'

import type { SelfReport } from '../../domain/selfReport.js'

/**
 * What a log says that a self report does not carry: everything of a `Log` that
 * {@link convertSelfReportToLog} does not work out from the self report itself.
 */
export type SelfReportLogContext = Omit<
  Log,
  'id' | 'contentId' | 'date' | 'category' | 'message' | 'origin'
>

/**
 * Converts a self report to the log it is stored as.
 *
 * The `message` and the `origin` are kept, and the level is the category, as both are named the
 * same. `context` gives the rest: the job the self report was reported during, and where it is
 * stored. The ids of the log are those `createLogWithIds` gives it, with `idNumber`, an integer
 * telling it apart from the logs converted with it: its `contentId` is therefore the one it has
 * when it is read back from its storage.
 *
 * ```ts
 * const logs = selfReports.map((selfReport, index) =>
 *   convertSelfReportToLog(selfReport, context, index)
 * )
 * ```
 */
export const convertSelfReportToLog = (
  { date, message, level, origin }: SelfReport,
  context: SelfReportLogContext,
  idNumber: number
): Log =>
  createLogWithIds(
    { ...context, date: date.toISOString(), category: level, message, origin },
    idNumber
  )

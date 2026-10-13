import { z } from 'zod'

import { convertToDateFromISO } from '../../../../shared/utils/convertToDate.js'
import type { SelfReport, SelfReportsSession } from '../../domain/selfReport.js'

/**
 * Validates the JSON a line of a self-report file holds.
 *
 * Its `date` is checked further when converting it to a `SelfReport`.
 */
const SelfReportLineDtoSchema = z.object({
  sessionId: z.int(),
  date: z.string(),
  level: z.enum(['WARNING', 'ERROR']),
  message: z.string(),
  origin: z.string().min(1)
})

/** A self report as a line of a self-report file holds it. */
type SelfReportLineDto = z.infer<typeof SelfReportLineDtoSchema>

/** What the session of a self report says that its line does not hold: where the line is stored, and in which group. */
export type SelfReportLineStorage = Omit<SelfReportsSession, 'sessionId'>

/**
 * Converts a line of a self-report file to the self report it holds, with its session: the
 * `sessionId` of the line, stored at `storage`.
 *
 * Returns `undefined` when the line holds none: its content is not JSON, does not have the shape
 * of a line, or has a date that is not an ISO one.
 *
 * ```ts
 * const selfReports = lines
 *   .map((line) => convertSelfReportLineToSelfReport(line, storage))
 *   .filter((selfReport) => selfReport !== undefined)
 * ```
 */
export const convertSelfReportLineToSelfReport = (
  line: string,
  storage: SelfReportLineStorage
): (SelfReport & SelfReportsSession) | undefined => {
  let json: unknown

  try {
    json = JSON.parse(line)
  } catch {
    return
  }

  const selfReportLineDto = SelfReportLineDtoSchema.safeParse(json)

  if (!selfReportLineDto.success) {
    return
  }

  const { sessionId, date: isoDate, level, message, origin } = selfReportLineDto.data
  const date = convertToDateFromISO(isoDate)

  if (date === undefined) {
    return
  }

  return { ...storage, sessionId, date, level, message, origin }
}

/**
 * Converts a self report, reported during the session `sessionId`, to the line it is stored as in
 * a self-report file.
 *
 * The line holds neither a `location`, a `locationName` nor a `groupName`, which are those of the
 * file it is read back from.
 *
 * ```ts
 * const lines = selfReports.map((selfReport) => convertSelfReportToSelfReportLine({ ...selfReport, sessionId }))
 * ```
 */
export const convertSelfReportToSelfReportLine = ({
  sessionId,
  date,
  level,
  message,
  origin
}: SelfReport & Pick<SelfReportsSession, 'sessionId'>): string => {
  const selfReportLineDto: SelfReportLineDto = {
    sessionId,
    date: date.toISOString(),
    level,
    message,
    origin
  }

  return JSON.stringify(selfReportLineDto)
}

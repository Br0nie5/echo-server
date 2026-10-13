import type { Log } from '../schemas/log.schema.js'

/**
 * Creates the `id` of a log, from the log without it.
 *
 * It is made of `idNumber`, an integer, and of its `date`, `jobId`, `location`, `level`,
 * `message` and `origin`. `idNumber` tells apart the logs that have all of those in common: it is
 * usually the position of the log where it is stored.
 *
 * ```ts
 * const logs = noIdLogs.map((noIdLog, index) => ({ ...noIdLog, id: createLogId(noIdLog, index) }))
 * ```
 */
export const createLogId = (
  { date, jobId, location, level, message, origin }: Omit<Log, 'id'>,
  idNumber: number
): string => JSON.stringify({ idNumber, date, jobId, location, level, message, origin })

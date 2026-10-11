import type { Log } from '../schemas/log.schema.js'

/**
 * Creates the `id` of a log, from the log without its ids.
 *
 * It is made of `idNumber`, an integer, and of its `date`, `jobId`, `location`, `category`,
 * `message` and `origin`. `idNumber` tells apart the logs that have all of those in common: it is
 * usually the position of the log where it is stored.
 *
 * ```ts
 * const id = createLogId(logWithoutIds, index)
 * ```
 */
export const createLogId = (
  { date, jobId, location, category, message, origin }: Omit<Log, 'id' | 'contentId'>,
  idNumber: number
): string => JSON.stringify({ idNumber, date, jobId, location, category, message, origin })

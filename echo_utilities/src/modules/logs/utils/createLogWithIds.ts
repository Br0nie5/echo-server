import type { Log } from '../schemas/log.schema.js'

import { createLogContentId } from './createLogContentId.js'
import { createLogId } from './createLogId.js'

/**
 * Creates a log from the log without its ids.
 *
 * Its `id` is the one of `createLogId`, given `idNumber`, an integer telling it apart from the logs
 * that have everything else in common (usually its position where it is stored), and its
 * `contentId` the one of `createLogContentId`.
 *
 * ```ts
 * const logs = noIdsLogs.map((noIdsLog, index) => createLogWithIds(noIdsLog, index))
 * ```
 */
export const createLogWithIds = (
  noIdsLog: Omit<Log, 'id' | 'contentId'>,
  idNumber: number
): Log => ({
  ...noIdsLog,
  id: createLogId(noIdsLog, idNumber),
  contentId: createLogContentId(noIdsLog)
})

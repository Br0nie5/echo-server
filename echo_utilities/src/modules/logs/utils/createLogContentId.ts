import type { Log } from '../schemas/log.schema.js'

/**
 * Creates the `contentId` of a log, from the log without its ids.
 *
 * It is made of its `location`, `category`, `message` and `origin`: two logs get the same one when
 * those are the same, whatever their date and their job.
 *
 * ```ts
 * const isSameContent = createLogContentId(logWithoutIds) === storedLog.contentId
 * ```
 */
export const createLogContentId = ({
  location,
  category,
  message,
  origin
}: Omit<Log, 'id' | 'contentId'>): string => JSON.stringify({ location, category, message, origin })

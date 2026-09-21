import type { Log } from '@echo/utilities'

import { groupLogs, sortGroupsByNewestFirstLog } from './groupLogs'
import type { LogsByGroup } from './types'

/** `parentId` keeps the group ids unique across the parent boxes (e.g. the day) they are shown in. */
export const groupLogsByGroup = (logs: Log[], parentId: string): LogsByGroup[] =>
  sortGroupsByNewestFirstLog(
    groupLogs<LogsByGroup>(
      logs,
      (log) => `${parentId} - ${log.groupName ?? ''}`,
      (id, log) => ({ id, name: log.groupName, logs: [log] })
    )
  )

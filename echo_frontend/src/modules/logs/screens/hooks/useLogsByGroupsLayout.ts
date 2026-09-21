import type { Log } from '@echo/utilities'
import { useMemo } from 'react'

import { groupLogsByGroup } from '../utils/groupLogsByGroup'
import type { LogsByGroup } from '../utils/types'

/** The logs grouped by group (directory), newest first. `logsByDayId` keeps the ids unique across days. */
export const useLogsByGroupsLayout = (
  logs: Log[],
  logsByDayId: string
): { logsByGroups: LogsByGroup[] } => {
  const logsByGroups = useMemo(() => groupLogsByGroup(logs, logsByDayId), [logs, logsByDayId])

  return { logsByGroups }
}

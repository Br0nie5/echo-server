import type { Log } from '@echo/utilities'
import { useMemo } from 'react'

import { groupLogsByDay } from '../utils/groupLogsByDay'
import type { LogsByDay } from '../utils/types'

/** The logs grouped by day, newest first. */
export const useLogsByDaysLayout = (logs: Log[]): { logsByDays: LogsByDay[] } => {
  const logsByDays = useMemo(() => groupLogsByDay(logs), [logs])

  return { logsByDays }
}

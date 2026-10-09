import type { Log } from '@echo/utilities'

import type { LogsByDay, LogsByGroup, LogsByJob } from './types'

/** Groups the logs sharing the same id, in order of first appearance. */
const groupLogs = <TGroup extends { logs: Log[] }>(
  logs: Log[],
  getGroupId: (log: Log) => string,
  createGroup: (groupId: string, firstLog: Log) => TGroup
): TGroup[] => {
  const groups = new Map<string, TGroup>()

  logs.forEach((log) => {
    const groupId = getGroupId(log)
    const group = groups.get(groupId)

    if (group === undefined) {
      groups.set(groupId, createGroup(groupId, log))
    } else {
      group.logs.push(log)
    }
  })

  return [...groups.values()]
}

/** Puts the groups whose first log is the most recent first. */
const sortGroupsByNewestFirstLog = <TGroup extends { logs: Log[] }>(groups: TGroup[]): TGroup[] =>
  groups.sort(
    (group1, group2) =>
      new Date(group2.logs[0].date).getTime() - new Date(group1.logs[0].date).getTime()
  )

/** The day of the log, as noon local time so timezone shifts do not change the day. */
const getLogDay = (log: Log): Date => {
  const logDay = new Date(log.date)
  logDay.setHours(12, 0, 0, 0)
  return logDay
}

/** Groups the logs by local day, newest first. */
export const groupLogsByDay = (logs: Log[]): LogsByDay[] =>
  sortGroupsByNewestFirstLog(
    groupLogs<LogsByDay>(
      logs,
      (log) => getLogDay(log).toISOString(),
      (id, log) => ({ id, date: getLogDay(log), logs: [log] })
    )
  )

/** Groups the logs by group (directory), newest first. `parentId` keeps the group ids unique across the parent boxes (e.g. the day) they are shown in. */
export const groupLogsByGroup = (logs: Log[], parentId: string): LogsByGroup[] =>
  sortGroupsByNewestFirstLog(
    groupLogs<LogsByGroup>(
      logs,
      (log) => `${parentId} - ${log.groupName ?? ''}`,
      (id, log) => ({ id, name: log.groupName, logs: [log] })
    )
  )

/** Groups the logs by job, newest first. A job is a run of consecutive logs of the same job id in the same file. */
export const groupLogsByJob = (logs: Log[]): LogsByJob[] => {
  const logsByJobs: LogsByJob[] = []

  logs.forEach((log, logIndex) => {
    const previousLogsByJob = logsByJobs.at(-1)

    if (
      previousLogsByJob !== undefined &&
      previousLogsByJob.jobId === log.jobId &&
      previousLogsByJob.locationName === log.locationName
    ) {
      previousLogsByJob.logs.push(log)
      return
    }

    logsByJobs.push({
      id: `${logIndex} - ${log.locationName} - ${log.jobId}`,
      locationName: log.locationName,
      jobId: log.jobId,
      logs: [log]
    })
  })

  return sortGroupsByNewestFirstLog(logsByJobs)
}

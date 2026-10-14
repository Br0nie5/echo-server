import type { Log } from '@echo/utilities'

import type { LogsByDay, LogsByGroup, LogsByJob } from './logsGroups'

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

/**
 * Groups the logs by group name, newest first.
 *
 * The logs without group name make one group, whose `name` is `undefined`.
 */
export const groupLogsByGroup = (logs: Log[]): LogsByGroup[] =>
  sortGroupsByNewestFirstLog(
    groupLogs<LogsByGroup>(
      logs,
      (log) => log.groupName ?? '',
      (id, log) => ({ id, name: log.groupName, logs: [log] })
    )
  )

/**
 * Groups the logs by job, newest first.
 *
 * A job is a run of consecutive logs with the same job id and the same location name. Its id is
 * the one of its first log.
 */
export const groupLogsByJob = (logs: Log[]): LogsByJob[] => {
  const logsByJobs: LogsByJob[] = []

  logs.forEach((log) => {
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
      id: log.id,
      locationName: log.locationName,
      jobId: log.jobId,
      logs: [log]
    })
  })

  return sortGroupsByNewestFirstLog(logsByJobs)
}

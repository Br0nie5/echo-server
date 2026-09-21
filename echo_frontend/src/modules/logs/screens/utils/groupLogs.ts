import type { Log } from '@echo/utilities'

/** Groups the logs sharing the same id, in order of first appearance. */
export const groupLogs = <TGroup extends { logs: Log[] }>(
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
export const sortGroupsByNewestFirstLog = <TGroup extends { logs: Log[] }>(
  groups: TGroup[]
): TGroup[] =>
  groups.sort(
    (group1, group2) =>
      new Date(group2.logs[0].date).getTime() - new Date(group1.logs[0].date).getTime()
  )

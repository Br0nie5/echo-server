/** Default start of the logs: the beginning of the day two days ago. */
export const getLogsInitialDate = (): string => {
  const logInitialDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  logInitialDate.setHours(0, 0, 0, 0) // First time of the day to include logs of that day too
  return logInitialDate.toISOString()
}

/** Earliest start selectable: the beginning of the day 14 days ago. */
export const getLogsMinimalDate = (): string => {
  const logMinimalDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  logMinimalDate.setHours(0, 0, 0, 0) // First time of the day to include logs of that day too
  return logMinimalDate.toISOString()
}

/** Latest start selectable: the beginning of today. */
export const getLogsMaximalDate = (): string => {
  const logMaximalDate = new Date(Date.now())
  logMaximalDate.setHours(0, 0, 0, 0) // First time of the day to include logs of that day too
  return logMaximalDate.toISOString()
}

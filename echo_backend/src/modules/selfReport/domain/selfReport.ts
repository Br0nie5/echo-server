/**
 * A diagnostic the backend reports about itself.
 *
 * `date` is when the problem was noticed and `level` how serious it is. `reportedFile` names what
 * the diagnostic is about, such as the log file a line could not be read from, and `reportedLine`,
 * an integer, the position it points to inside, left out when it points to none.
 */
export type SelfReport = {
  date: Date
  message: string
  level: 'warning' | 'error'
  reportedFile: string
  reportedLine?: number
}

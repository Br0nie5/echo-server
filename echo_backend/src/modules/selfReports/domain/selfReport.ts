/**
 * A diagnostic the backend reports about itself.
 *
 * `date` is when the problem was noticed and `level` how serious it is. `origin`, never empty, says
 * what the diagnostic is about, in any form: whoever reports chooses it (the line of a log file
 * that could not be read, as `path:line`, the name of the part of the backend that failed, the
 * address of another server...), and nothing reads it as more than a text.
 *
 * Two self reports with the same `level`, `message` and `origin` say the same thing, whatever their
 * date: they are the same problem, noticed twice.
 */
export type SelfReport = {
  date: Date
  message: string
  level: 'WARNING' | 'ERROR'
  origin: string
}

/**
 * What the self reports of one session, stored in one place, all share: the session and where it
 * is stored.
 *
 * A storage gives it to each self report it holds. `sessionId`, an integer, identifies the run of
 * the backend the self reports were reported during. `location` says where they are stored, which
 * means something to the storage only (the path of a file, the address of another server...), and
 * `locationName` is the short name of that location, the one to show to a user. `groupName` names
 * the group the storage puts them in, when it puts them in one.
 */
export type SelfReportsSession = {
  sessionId: number
  location: string
  locationName: string
  groupName?: string
}

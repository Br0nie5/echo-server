/**
 * A diagnostic the backend reports about itself.
 *
 * `id` identifies it among all the self reports, `date` is when the problem was noticed and `level`
 * how serious it is. `origin`, never empty, says what the diagnostic is about, such as the line of
 * a log file that could not be read, written `path:line:column`, `path:line` when it points to no
 * column and `path` when it points to no line either.
 */
export type SelfReport = {
  id: string
  date: Date
  message: string
  level: 'WARNING' | 'ERROR'
  origin: string
}

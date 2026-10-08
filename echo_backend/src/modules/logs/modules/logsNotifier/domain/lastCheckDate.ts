/**
 * When the logs were last checked for problem logs.
 *
 * A check only looks at the logs logged since `lastCheckDate`, so a problem log is notified once.
 */
export interface LastCheckDate {
  lastCheckDate: Date
}

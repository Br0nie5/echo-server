/**
 * Runs once before the tests, in the process that spawns the test workers, which inherit its env.
 * The app groups and formats logs in the time zone and the locale of the user, so the tests would
 * otherwise give different results (and snapshots) depending on the machine running them.
 */
export const setup = (): void => {
  process.env.TZ = 'UTC'
  process.env.LC_ALL = 'en-GB'
}

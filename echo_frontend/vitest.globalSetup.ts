/**
 * Runs once before the tests, in the process that spawns the test workers, which inherit its env.
 * The app groups and formats logs in local time, so the tests would otherwise give different
 * results (and snapshots) depending on the timezone of the machine running them.
 */
export const setup = (): void => {
  process.env.TZ = 'UTC'
}

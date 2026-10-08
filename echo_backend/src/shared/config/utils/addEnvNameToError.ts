/**
 * Runs `parse` and returns its value, naming the environment variable `envName` in the error it
 * throws.
 *
 * It lets a parser that does not know which variable it reads say what is wrong with the value
 * only: the error thrown here has `<envName>: <message of the error of the parser>` as its
 * message, and the error of the parser as its `cause`.
 *
 * ```ts
 * const retentionDays = addEnvNameToError('SELF_REPORTS_RETENTION_DAYS', () =>
 *   parseDaysNumber(processEnv.SELF_REPORTS_RETENTION_DAYS, 10)
 * )
 * ```
 */
export const addEnvNameToError = <T>(envName: string, parse: () => T): T => {
  try {
    return parse()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${envName}: ${message}`, { cause: error })
  }
}

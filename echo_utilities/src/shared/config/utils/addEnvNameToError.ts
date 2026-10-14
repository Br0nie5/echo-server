/**
 * Runs `parse` and returns its value, naming the environment variable `envName` in the error it
 * throws.
 *
 * It lets a parser that does not know which variable it reads say what is wrong with the value
 * only: the error thrown here has `<envName>: <message of the error of the parser>` as its
 * message, and the error of the parser as its `cause`.
 *
 * ```ts
 * addEnvNameToError('MAX_RETRIES', () => parseInteger('3')) // 3
 *
 * try {
 *   addEnvNameToError('MAX_RETRIES', () => parseInteger('many'))
 * } catch (error) {
 *   error.message // 'MAX_RETRIES: Invalid integer: many is not an integer'
 * }
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

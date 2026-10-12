import type { LoginRequest, SignUpRequest } from '@echo/utilities'

/**
 * What the auth screen does after the auth check.
 *
 * `redirect` when the user is already authenticated, `login` when they are not, and `signUp` when
 * no account exists yet.
 */
export type AuthCheckResult = 'redirect' | 'login' | 'signUp'

/** The error of a login refused because of the username or the password. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials')
    this.name = 'InvalidCredentialsError'
  }
}

/**
 * The authentication of the user, as the auth module needs it from the outside.
 *
 * The domain only states what it needs: the `infra` folder holds the implementations.
 */
export interface AuthRepository {
  /**
   * Asks whether the user is authenticated.
   *
   * Not being so is a regular result (`login` or `signUp`): any other failure is thrown. Aborting
   * `signal` cancels the check.
   */
  checkAuthentication: (signal?: AbortSignal) => Promise<AuthCheckResult>
  /**
   * Logs the user in.
   *
   * Throws an `InvalidCredentialsError` when the credentials are refused, and the error it got for
   * any other failure.
   */
  login: (request: LoginRequest) => Promise<void>
  /**
   * Creates the first account, the one of the admin, which logs the user in.
   *
   * Throws when the sign up is refused.
   */
  signUp: (request: SignUpRequest) => Promise<void>
}

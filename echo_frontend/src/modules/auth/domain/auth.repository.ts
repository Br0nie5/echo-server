import type { LoginRequest, SignUpRequest } from '@echo/utilities'

/** What to do after the auth check: `redirect` (already authenticated), `login` or `signUp` (no account yet). */
export type AuthCheckResult = 'redirect' | 'login' | 'signUp'

/** Thrown by a login the backend refused because of the username or the password. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials')
    this.name = 'InvalidCredentialsError'
  }
}

/**
 * Authentication of the user, and what the auth module needs from the backend for it.
 *
 * The domain only states what it needs: the `infra` folder holds the implementations.
 */
export interface AuthRepository {
  /** Asks whether the user is authenticated. Aborting `signal` cancels the check. Not being so is a regular result (`login` or `signUp`), any other failure is thrown. */
  checkAuthentication: (signal?: AbortSignal) => Promise<AuthCheckResult>
  /** Logs the user in. Throws an `InvalidCredentialsError` when the credentials are refused, and the error it got for any other failure. */
  login: (request: LoginRequest) => Promise<void>
  /** Creates the first (admin) account, which logs the user in. Throws when the sign up is refused. */
  signUp: (request: SignUpRequest) => Promise<void>
}

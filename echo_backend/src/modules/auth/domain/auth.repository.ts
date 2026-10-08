/**
 * Storage of the accounts, and what the authentication needs from it.
 *
 * The domain only states what it needs from the storage: the `infra` folder holds the
 * implementations.
 */
export interface AuthRepository {
  /** Whether no user exists yet. */
  needsSignup: () => boolean
  /** Only the very first user can sign up, and becomes the admin. Returns false if refused. */
  signUpFirstAdmin: (username: string, password: string) => Promise<boolean>
  /** Whether the password is the one of that user. False for an unknown user. */
  areCredentialsValid: (username: string, password: string) => Promise<boolean>
}

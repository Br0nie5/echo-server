/** An account to create. */
export interface NewUser {
  username: string
  /** The password as the user typed it: storing it safely is up to the storage. */
  password: string
  isAdmin: boolean
}

/**
 * Storage of the accounts.
 *
 * The domain only states what it needs from the storage: the `infra` folder holds the
 * implementations. Who may sign up or log in is decided by the use cases of `application/`.
 *
 * ```ts
 * if (!(await authRepository.hasAnyUser())) {
 *   await authRepository.createUser({ username, password, isAdmin: true })
 * }
 * ```
 */
export interface AuthRepository {
  /** Whether at least one account is stored. */
  hasAnyUser: () => Promise<boolean>
  /** Stores the account of `newUser`. Throws when it cannot be stored, such as when its username is taken. */
  createUser: (newUser: NewUser) => Promise<void>
  /** Whether the password is the one of that user. False for an unknown user. */
  areCredentialsValid: (username: string, password: string) => Promise<boolean>
}

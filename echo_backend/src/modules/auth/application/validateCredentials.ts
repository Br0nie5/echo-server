import type { AuthRepository } from '../domain/auth.repository.js'

/**
 * Tells whether the credentials are those of a user: `username` is the one of an account of
 * `authRepository`, and `password` the one of that account.
 *
 * ```ts
 * const areCredentialsValid = await validateCredentials(authRepository, username, password)
 * ```
 */
export const validateCredentials = (
  authRepository: AuthRepository,
  username: string,
  password: string
): Promise<boolean> => authRepository.areCredentialsValid(username, password)

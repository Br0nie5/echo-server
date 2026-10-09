import type { AuthRepository } from '../domain/auth.repository.js'
import { SignUpRefusedError } from '../domain/signUpRefusedError.js'

/**
 * Signs up the user as the admin, when no account exists yet.
 *
 * Throws a `SignUpRefusedError` when the user may not sign up: an account already exists, or
 * another sign up is in progress.
 */
export type SignUpFirstAdmin = (username: string, password: string) => Promise<void>

/**
 * Tells whether a user can still sign up: only the very first one can, so it is as long as
 * `authRepository` has no account.
 *
 * ```ts
 * const needsSignUp = await canSignUp(authRepository)
 * ```
 */
export const canSignUp = async (authRepository: AuthRepository): Promise<boolean> =>
  !(await authRepository.hasAnyUser())

/**
 * Builds the use case signing up the first admin, on top of the accounts of `authRepository`.
 *
 * Only the very first user can sign up, and becomes the admin. A sign up asked for while another
 * one is still in progress is refused, so two requests sent at the same time never both sign up:
 * should the one in progress fail, the user signs up again.
 *
 * ```ts
 * const signUpFirstAdmin = createSignUpFirstAdmin(authRepository)
 * await signUpFirstAdmin(username, password)
 * ```
 */
export const createSignUpFirstAdmin = (authRepository: AuthRepository): SignUpFirstAdmin => {
  let isSignUpInProgress = false

  return async (username, password) => {
    if (!(await canSignUp(authRepository))) {
      throw new SignUpRefusedError('An account already exists.')
    }

    // No `await` between this check and the flag being set: it is what keeps two sign ups that
    // both found no account from both going on.
    if (isSignUpInProgress) {
      throw new SignUpRefusedError('Another sign up is in progress.')
    }

    isSignUpInProgress = true

    try {
      await authRepository.createUser({ username, password, isAdmin: true })
    } finally {
      isSignUpInProgress = false
    }
  }
}

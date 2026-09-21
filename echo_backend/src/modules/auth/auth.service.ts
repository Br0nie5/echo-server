import bcrypt from 'bcrypt'

import type { UsersRepository } from './users.repository.js'

/** Bcrypt cost factor: each increment doubles the time needed to hash a password. */
const BCRYPT_SALT_ROUNDS = 12

/** Business rules of the authentication. */
export interface AuthService {
  /** Whether no user exists yet. */
  needsSignup: () => boolean
  /** Only the very first user can sign up, and becomes the admin. Returns false if refused. */
  signUpFirstAdmin: (username: string, password: string) => Promise<boolean>
  /** Whether the password matches the stored hash of that user. False for an unknown user. */
  areCredentialsValid: (username: string, password: string) => Promise<boolean>
}

/** Builds the auth service on top of `usersRepository`. Passwords are stored bcrypt-hashed, never in clear. */
export const createAuthService = (usersRepository: UsersRepository): AuthService => ({
  needsSignup: (): boolean => !usersRepository.hasAnyUser(),

  signUpFirstAdmin: async (username: string, password: string): Promise<boolean> => {
    if (usersRepository.hasAnyUser()) {
      return false
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
    usersRepository.createAdmin(username, passwordHash)
    return true
  },

  areCredentialsValid: async (username: string, password: string): Promise<boolean> => {
    const user = usersRepository.findByUsername(username)
    if (!user) {
      return false
    }

    return bcrypt.compare(password, user.password_hash)
  }
})

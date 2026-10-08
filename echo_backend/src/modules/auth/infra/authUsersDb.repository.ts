import bcrypt from 'bcrypt'
import type { Database } from 'better-sqlite3'

import type { AuthRepository } from '../domain/auth.repository.js'

import type { UserDto } from './dto/user.dto.js'

/** Bcrypt cost factor: each increment doubles the time needed to hash a password. */
const BCRYPT_SALT_ROUNDS = 12

/**
 * Builds the `AuthRepository` that keeps its accounts in `usersDb`, the SQLite database
 * `createUsersDb` gives.
 *
 * Passwords are stored bcrypt-hashed, never in clear.
 */
export const createAuthUsersDbRepository = (usersDb: Database): AuthRepository => {
  const hasAnyUser = (): boolean =>
    usersDb.prepare('SELECT id FROM users LIMIT 1').get() !== undefined

  return {
    needsSignup: (): boolean => !hasAnyUser(),

    signUpFirstAdmin: async (username: string, password: string): Promise<boolean> => {
      if (hasAnyUser()) {
        return false
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
      usersDb
        .prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)')
        .run(username, passwordHash)
      return true
    },

    areCredentialsValid: async (username: string, password: string): Promise<boolean> => {
      const user = usersDb.prepare('SELECT * FROM users WHERE username = ?').get(username) as
        UserDto | undefined
      if (!user) {
        return false
      }

      return bcrypt.compare(password, user.password_hash)
    }
  }
}

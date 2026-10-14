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
 * Passwords are stored bcrypt-hashed, never in clear. Checking the credentials of an unknown user
 * takes as long as those of a known one, so the time of the answer does not tell which usernames
 * exist: the password is compared to a hash made the same way, once, the first time it is needed.
 */
export const createAuthUsersDbRepository = (usersDb: Database): AuthRepository => {
  let unknownUserPasswordHash: Promise<string> | undefined

  const getUnknownUserPasswordHash = (): Promise<string> =>
    (unknownUserPasswordHash ??= bcrypt.hash('dummy_unknown_user_password', BCRYPT_SALT_ROUNDS))

  return {
    hasAnyUser: async (): Promise<boolean> =>
      usersDb.prepare('SELECT id FROM users LIMIT 1').get() !== undefined,

    createUser: async ({ username, password, isAdmin }): Promise<void> => {
      const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
      const isAdminColumn: UserDto['is_admin'] = isAdmin ? 1 : 0

      usersDb
        .prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)')
        .run(username, passwordHash, isAdminColumn)
    },

    areCredentialsValid: async (username: string, password: string): Promise<boolean> => {
      const user = usersDb.prepare('SELECT * FROM users WHERE username = ?').get(username) as
        UserDto | undefined
      if (!user) {
        // Answering at once would be faster than for a known user, whose password bcrypt
        // compares: timing the answers would tell which usernames exist. Comparing to a hash of
        // the same cost takes as long.
        await bcrypt.compare(password, await getUnknownUserPasswordHash())
        return false
      }

      return bcrypt.compare(password, user.password_hash)
    }
  }
}

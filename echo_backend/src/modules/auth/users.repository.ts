import type { Database } from 'better-sqlite3'

import type { DbUser } from './users.db.js'

/** Storage of the users. */
export interface UsersRepository {
  /** Whether at least one user is stored. */
  hasAnyUser: () => boolean
  findByUsername: (username: string) => DbUser | undefined
  /** Stores a new admin user. `passwordHash` must already be hashed. */
  createAdmin: (username: string, passwordHash: string) => void
}

/** Stores the users in the given SQLite database. */
export const createSqliteUsersRepository = (usersDb: Database): UsersRepository => ({
  hasAnyUser: (): boolean => usersDb.prepare('SELECT id FROM users LIMIT 1').get() !== undefined,

  findByUsername: (username: string): DbUser | undefined =>
    usersDb.prepare('SELECT * FROM users WHERE username = ?').get(username) as DbUser | undefined,

  createAdmin: (username: string, passwordHash: string): void => {
    usersDb
      .prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)')
      .run(username, passwordHash)
  }
})

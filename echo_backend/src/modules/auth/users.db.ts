import fs from 'fs'
import path from 'path'

import Database from 'better-sqlite3'

/** A row of the `users` table. */
export interface DbUser {
  id: number
  username: string
  password_hash: string
  is_admin: 0 | 1
}

/** Opens (creating it if needed) the users SQLite database at `usersDbFile`, owner-only readable. */
export const openUsersDb = (usersDbFile: string): Database.Database => {
  fs.mkdirSync(path.dirname(usersDbFile), { recursive: true })

  const usersDb = new Database(usersDbFile)

  fs.chmodSync(usersDbFile, 0o600)

  usersDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0
    )
  `)

  return usersDb
}

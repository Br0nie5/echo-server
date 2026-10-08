import fs from 'node:fs/promises'
import path from 'node:path'

import Database from 'better-sqlite3'

import type { AuthConfig } from '../../../shared/config/backConfig.js'

/**
 * Opens the users SQLite database at `usersDbFilePath`.
 *
 * The file, its directory and the `users` table are created if needed, and the file is made
 * readable and writable by its owner only. Throws when the directory or the file cannot be
 * created.
 */
export const createUsersDb = async ({
  usersDbFilePath
}: AuthConfig): Promise<Database.Database> => {
  await fs.mkdir(path.dirname(usersDbFilePath), { recursive: true })

  const usersDb = new Database(usersDbFilePath)

  await fs.chmod(usersDbFilePath, 0o600)

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

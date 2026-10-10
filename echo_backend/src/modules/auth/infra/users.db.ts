import path from 'path'

import Database from 'better-sqlite3'

import type { AuthConfig } from '../../../shared/config/backConfig.js'
import type { FilesService } from '../../../shared/services/files.service.js'

/**
 * Opens the users SQLite database at `usersDbFilePath`.
 *
 * The file, its directory and the `users` table are created if needed, and the file is made
 * readable and writable by its owner only, through `filesService`. Throws when the directory or
 * the file cannot be created.
 *
 * ```ts
 * const authRepository = createAuthUsersDbRepository(await createUsersDb(authConfig, filesService))
 * ```
 */
export const createUsersDb = async (
  { usersDbFilePath }: AuthConfig,
  filesService: FilesService
): Promise<Database.Database> => {
  await filesService.createDirectory(path.dirname(usersDbFilePath))

  const usersDb = new Database(usersDbFilePath)

  await filesService.restrictFileAccessToOwner(usersDbFilePath)

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

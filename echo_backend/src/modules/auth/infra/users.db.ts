import Database from 'better-sqlite3'

import type { FilesService } from '../../../shared/services/files.service.js'

/**
 * Opens the users SQLite database at `usersDbFilePath`.
 *
 * The file, its directory and the `users` table are created if needed. The file is readable and
 * writable by its owner only before SQLite opens it, through `filesService`, and SQLite gives its
 * journal the permissions of the file. Throws when the directory or the file cannot be created.
 *
 * ```ts
 * const usersDb = await createUsersDb({ usersDbFilePath }, filesService)
 * const authRepository = createAuthUsersDbRepository(usersDb)
 * ```
 */
export const createUsersDb = async (
  { usersDbFilePath }: { usersDbFilePath: string },
  filesService: FilesService
): Promise<Database.Database> => {
  await filesService.createOwnerOnlyFile(usersDbFilePath)

  const usersDb = new Database(usersDbFilePath)

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

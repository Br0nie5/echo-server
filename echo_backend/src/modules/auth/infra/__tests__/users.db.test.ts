import Database from 'better-sqlite3'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('better-sqlite3', async (importOriginal) => {
  const { default: ActualDatabase } = await importOriginal<{ default: typeof Database }>()
  return {
    default: vi.fn(function () {
      return new ActualDatabase(':memory:')
    })
  }
})

import { getMockAuthConfig } from '../../../../test/mocks/configs.js'
import { getMockFilesService } from '../../../../test/mocks/filesService.js'
import { createUsersDb } from '../users.db.js'

const { default: InMemoryDatabase } = await vi.importActual<{ default: typeof Database }>(
  'better-sqlite3'
)
const filesService = getMockFilesService()
const usersDbFilePath = '/data/nested/users.db'

describe('createUsersDb', () => {
  let usersDb: Database.Database | undefined

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    usersDb?.close()
    usersDb = undefined
  })

  it('should create the parent directory, open the file and restrict it to its owner', async () => {
    usersDb = await createUsersDb(getMockAuthConfig({ usersDbFilePath }), filesService)

    expect(filesService.createDirectory).toHaveBeenCalledExactlyOnceWith('/data/nested')
    expect(Database).toHaveBeenCalledExactlyOnceWith(usersDbFilePath)
    expect(filesService.restrictFileAccessToOwner).toHaveBeenCalledExactlyOnceWith(usersDbFilePath)
  })

  it('should create the users table with a unique username', async () => {
    usersDb = await createUsersDb(getMockAuthConfig({ usersDbFilePath }), filesService)
    const insert = usersDb.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')

    insert.run('admin', 'hash')

    expect(() => insert.run('admin', 'other')).toThrow(/UNIQUE/)
    expect(usersDb.prepare('SELECT is_admin FROM users').get()).toEqual({ is_admin: 0 })
  })

  it('should keep the users of an existing database', async () => {
    const existingDb = new InMemoryDatabase(':memory:')
    existingDb.exec(
      'CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, is_admin INTEGER NOT NULL DEFAULT 0)'
    )
    existingDb.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('a', 'h')
    vi.mocked(Database).mockImplementationOnce(function () {
      return existingDb
    })

    usersDb = await createUsersDb(getMockAuthConfig({ usersDbFilePath }), filesService)

    expect(usersDb.prepare('SELECT username FROM users').get()).toEqual({ username: 'a' })
  })
})

import fs from 'fs'
import os from 'os'
import path from 'path'

import type { Database } from 'better-sqlite3'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { getMockAuthConfig } from '../../../test/mocks/configs.js'
import { openUsersDb } from '../users.db.js'

describe('openUsersDb', () => {
  let tmpDir: string
  let db: Database | undefined

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'echo-users-db-'))
  })

  afterEach(() => {
    db?.close()
    db = undefined
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should create missing parent directories and an owner-only database file', async () => {
    const dbFile = path.join(tmpDir, 'nested', 'users.db')

    db = await openUsersDb(getMockAuthConfig({ usersDbFilePath: dbFile }))

    expect(fs.statSync(dbFile).mode & 0o777).toBe(0o600)
  })

  it('should create the users table with a unique username', async () => {
    db = await openUsersDb(getMockAuthConfig({ usersDbFilePath: path.join(tmpDir, 'users.db') }))
    const insert = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')

    insert.run('admin', 'hash')

    expect(() => insert.run('admin', 'other')).toThrow(/UNIQUE/)
    expect(db.prepare('SELECT is_admin FROM users').get()).toEqual({ is_admin: 0 })
  })

  it('should reopen an existing database without losing data', async () => {
    const authConfig = getMockAuthConfig({ usersDbFilePath: path.join(tmpDir, 'users.db') })
    const firstDb = await openUsersDb(authConfig)
    firstDb.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('a', 'h')
    firstDb.close()

    db = await openUsersDb(authConfig)

    expect(db.prepare('SELECT username FROM users').get()).toEqual({ username: 'a' })
  })
})

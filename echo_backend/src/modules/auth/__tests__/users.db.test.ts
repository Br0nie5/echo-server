import fs from 'fs'
import os from 'os'
import path from 'path'

import type { Database } from 'better-sqlite3'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

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

  it('should create missing parent directories and an owner-only database file', () => {
    const dbFile = path.join(tmpDir, 'nested', 'users.db')

    db = openUsersDb(dbFile)

    expect(fs.statSync(dbFile).mode & 0o777).toBe(0o600)
  })

  it('should create the users table with a unique username', () => {
    db = openUsersDb(path.join(tmpDir, 'users.db'))
    const insert = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')

    insert.run('admin', 'hash')

    expect(() => insert.run('admin', 'other')).toThrow(/UNIQUE/)
    expect(db.prepare('SELECT is_admin FROM users').get()).toEqual({ is_admin: 0 })
  })

  it('should reopen an existing database without losing data', () => {
    const dbFile = path.join(tmpDir, 'users.db')
    openUsersDb(dbFile)
      .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
      .run('a', 'h')

    db = openUsersDb(dbFile)

    expect(db.prepare('SELECT username FROM users').get()).toEqual({ username: 'a' })
  })
})

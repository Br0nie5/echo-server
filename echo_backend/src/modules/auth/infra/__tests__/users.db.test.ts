import fs from 'fs'
import os from 'os'
import path from 'path'

import type { Database } from 'better-sqlite3'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { getMockAuthConfig } from '../../../../test/mocks/configs.js'
import { createUsersDb } from '../users.db.js'

describe('createUsersDb', () => {
  let temporaryDirPath: string
  let usersDb: Database | undefined

  beforeEach(() => {
    temporaryDirPath = fs.mkdtempSync(path.join(os.tmpdir(), 'echo-users-db-'))
  })

  afterEach(() => {
    usersDb?.close()
    usersDb = undefined
    fs.rmSync(temporaryDirPath, { recursive: true, force: true })
  })

  it('should create missing parent directories and an owner-only database file', async () => {
    const usersDbFilePath = path.join(temporaryDirPath, 'nested', 'users.db')

    usersDb = await createUsersDb(getMockAuthConfig({ usersDbFilePath }))

    expect(fs.statSync(usersDbFilePath).mode & 0o777).toBe(0o600)
  })

  it('should create the users table with a unique username', async () => {
    usersDb = await createUsersDb(
      getMockAuthConfig({ usersDbFilePath: path.join(temporaryDirPath, 'users.db') })
    )
    const insert = usersDb.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')

    insert.run('admin', 'hash')

    expect(() => insert.run('admin', 'other')).toThrow(/UNIQUE/)
    expect(usersDb.prepare('SELECT is_admin FROM users').get()).toEqual({ is_admin: 0 })
  })

  it('should reopen an existing database without losing data', async () => {
    const authConfig = getMockAuthConfig({
      usersDbFilePath: path.join(temporaryDirPath, 'users.db')
    })
    const firstDb = await createUsersDb(authConfig)
    firstDb.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('a', 'h')
    firstDb.close()

    usersDb = await createUsersDb(authConfig)

    expect(usersDb.prepare('SELECT username FROM users').get()).toEqual({ username: 'a' })
  })
})

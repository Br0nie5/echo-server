import type { Database } from 'better-sqlite3'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { createSqliteUsersRepository } from '../users.repository.js'

const get = vi.fn()
const run = vi.fn()
const usersDb = { prepare: vi.fn(() => ({ get, run })) }
const UsersRepository = createSqliteUsersRepository(usersDb as unknown as Database)

describe('createSqliteUsersRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hasAnyUser', () => {
    it('should return true when an user exists', () => {
      get.mockReturnValueOnce({ id: 1 })
      expect(UsersRepository.hasAnyUser()).toBe(true)
    })

    it('should return false when there is no user', () => {
      get.mockReturnValueOnce(undefined)
      expect(UsersRepository.hasAnyUser()).toBe(false)
    })
  })

  describe('findByUsername', () => {
    it('should find a user by username and return the user object', () => {
      const user = { id: 1, username: 'a', password_hash: 'h', is_admin: 1 }
      get.mockReturnValueOnce(user)

      expect(UsersRepository.findByUsername('a')).toBe(user)
      expect(usersDb.prepare).toHaveBeenCalledWith('SELECT * FROM users WHERE username = ?')
      expect(get).toHaveBeenCalledWith('a')
    })
  })

  describe('createAdmin', () => {
    it('should insert an admin user', () => {
      UsersRepository.createAdmin('a', 'hash')

      expect(usersDb.prepare).toHaveBeenCalledWith(
        'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)'
      )
      expect(run).toHaveBeenCalledWith('a', 'hash')
    })
  })
})

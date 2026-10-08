import bcrypt from 'bcrypt'
import type { Database } from 'better-sqlite3'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { createAuthUsersDbRepository } from '../authUsersDb.repository.js'
import type { UserDto } from '../dto/user.dto.js'

const get = vi.fn()
const run = vi.fn()
const usersDb = { prepare: vi.fn(() => ({ get, run })) }
const AuthRepository = createAuthUsersDbRepository(usersDb as unknown as Database)

describe('createAuthUsersDbRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('needsSignup', () => {
    it('should be true when there is no user', () => {
      get.mockReturnValueOnce(undefined)

      expect(AuthRepository.needsSignup()).toBe(true)
      expect(usersDb.prepare).toHaveBeenCalledWith('SELECT id FROM users LIMIT 1')
    })

    it('should be false when a user exists', () => {
      get.mockReturnValueOnce({ id: 1 })

      expect(AuthRepository.needsSignup()).toBe(false)
    })
  })

  describe('signUpFirstAdmin', () => {
    it('should insert an admin with a hashed password when no user exists', async () => {
      get.mockReturnValueOnce(undefined)

      expect(await AuthRepository.signUpFirstAdmin('admin', 'secret')).toBe(true)

      expect(usersDb.prepare).toHaveBeenCalledWith(
        'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)'
      )
      const [username, passwordHash] = run.mock.calls[0]
      expect(username).toBe('admin')
      expect(passwordHash).not.toBe('secret')
      expect(await bcrypt.compare('secret', passwordHash)).toBe(true)
    })

    it('should refuse when a user already exists', async () => {
      get.mockReturnValueOnce({ id: 1 })

      expect(await AuthRepository.signUpFirstAdmin('admin', 'secret')).toBe(false)
      expect(run).not.toHaveBeenCalled()
    })
  })

  describe('areCredentialsValid', () => {
    const user: UserDto = {
      id: 1,
      username: 'admin',
      password_hash: bcrypt.hashSync('secret', 1),
      is_admin: 1
    }

    it('should be true for a matching username and password', async () => {
      get.mockReturnValueOnce(user)

      expect(await AuthRepository.areCredentialsValid('admin', 'secret')).toBe(true)
      expect(usersDb.prepare).toHaveBeenCalledWith('SELECT * FROM users WHERE username = ?')
      expect(get).toHaveBeenCalledWith('admin')
    })

    it('should be false for a wrong password', async () => {
      get.mockReturnValueOnce(user)

      expect(await AuthRepository.areCredentialsValid('admin', 'nope')).toBe(false)
    })

    it('should be false for an unknown user', async () => {
      get.mockReturnValueOnce(undefined)

      expect(await AuthRepository.areCredentialsValid('ghost', 'secret')).toBe(false)
    })
  })
})

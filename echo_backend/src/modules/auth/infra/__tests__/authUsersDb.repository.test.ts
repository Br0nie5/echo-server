import bcrypt from 'bcrypt'
import type { Database } from 'better-sqlite3'
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'

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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('hasAnyUser', () => {
    it('should be false when there is no user', async () => {
      get.mockReturnValueOnce(undefined)

      expect(await AuthRepository.hasAnyUser()).toBe(false)
      expect(usersDb.prepare).toHaveBeenCalledWith('SELECT id FROM users LIMIT 1')
    })

    it('should be true when a user exists', async () => {
      get.mockReturnValueOnce({ id: 1 })

      expect(await AuthRepository.hasAnyUser()).toBe(true)
    })
  })

  describe('createUser', () => {
    it.each([
      { isAdmin: true, isAdminColumn: 1 },
      { isAdmin: false, isAdminColumn: 0 }
    ])(
      'should insert the user with a hashed password and is_admin $isAdminColumn when isAdmin is $isAdmin',
      async ({ isAdmin, isAdminColumn }) => {
        await AuthRepository.createUser({ username: 'admin', password: 'secret', isAdmin })

        expect(usersDb.prepare).toHaveBeenCalledWith(
          'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)'
        )
        const [username, passwordHash, storedIsAdmin] = run.mock.calls[0]
        expect(username).toBe('admin')
        expect(passwordHash).not.toBe('secret')
        expect(await bcrypt.compare('secret', passwordHash)).toBe(true)
        expect(storedIsAdmin).toBe(isAdminColumn)
      }
    )

    it('should throw the error of the database when the user cannot be inserted', async () => {
      run.mockImplementationOnce(() => {
        throw new Error('UNIQUE constraint failed: users.username')
      })

      await expect(
        AuthRepository.createUser({ username: 'admin', password: 'secret', isAdmin: true })
      ).rejects.toThrow('UNIQUE constraint failed')
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

    it('should be false for an unknown user, after comparing the password to a hash of the same cost', async () => {
      const compare = vi.spyOn(bcrypt, 'compare')
      get.mockReturnValueOnce(undefined)

      expect(await AuthRepository.areCredentialsValid('ghost', 'secret')).toBe(false)
      expect(compare).toHaveBeenCalledExactlyOnceWith(
        'secret',
        expect.stringMatching(/^\$2b\$12\$/)
      )
    })

    it('should make the hash an unknown user is compared to once', async () => {
      const hash = vi.spyOn(bcrypt, 'hash')
      const authRepository = createAuthUsersDbRepository(usersDb as unknown as Database)
      get.mockReturnValueOnce(undefined).mockReturnValueOnce(undefined)

      await authRepository.areCredentialsValid('ghost', 'secret')
      await authRepository.areCredentialsValid('other ghost', 'secret')

      expect(hash).toHaveBeenCalledOnce()
    })
  })
})

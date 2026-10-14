import bcrypt from 'bcrypt'
import type { Database } from 'better-sqlite3'
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'

import { createAuthUsersDbRepository } from '../authUsersDb.repository.js'

const get = vi.fn()
const run = vi.fn()
const usersDb = { prepare: vi.fn(() => ({ get, run })) } as unknown as Database

describe('createAuthUsersDbRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createUser', () => {
    it('Should store a user who is not an admin as such', async () => {
      const authRepository = createAuthUsersDbRepository(usersDb)

      await authRepository.createUser({ username: 'reader', password: 'secret', isAdmin: false })

      const [username, , isAdminColumn] = run.mock.calls[0]
      expect(username).toBe('reader')
      expect(isAdminColumn).toBe(0)
    })
  })

  describe('areCredentialsValid', () => {
    it('Should be false for an unknown user, after comparing the password to a hash of the same cost', async () => {
      const authRepository = createAuthUsersDbRepository(usersDb)
      const compare = vi.spyOn(bcrypt, 'compare')
      get.mockReturnValueOnce(undefined)

      expect(await authRepository.areCredentialsValid('ghost', 'secret')).toBe(false)
      expect(compare).toHaveBeenCalledExactlyOnceWith(
        'secret',
        expect.stringMatching(/^\$2b\$12\$/)
      )
    })

    it('Should make the hash an unknown user is compared to once', async () => {
      const hash = vi.spyOn(bcrypt, 'hash')
      const authRepository = createAuthUsersDbRepository(usersDb)
      get.mockReturnValueOnce(undefined).mockReturnValueOnce(undefined)

      await authRepository.areCredentialsValid('ghost', 'secret')
      await authRepository.areCredentialsValid('other ghost', 'secret')

      expect(hash).toHaveBeenCalledOnce()
    })
  })
})

import bcrypt from 'bcrypt'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { createAuthService } from '../auth.service.js'

const UsersRepository = {
  hasAnyUser: vi.fn(),
  findByUsername: vi.fn(),
  createAdmin: vi.fn()
}
const AuthService = createAuthService(UsersRepository)

describe('AuthService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('needsSignup', () => {
    it('should be true when there is no user', () => {
      vi.mocked(UsersRepository.hasAnyUser).mockReturnValue(false)
      expect(AuthService.needsSignup()).toBe(true)
    })

    it('should be false when a user exists', () => {
      vi.mocked(UsersRepository.hasAnyUser).mockReturnValue(true)
      expect(AuthService.needsSignup()).toBe(false)
    })
  })

  describe('signUpFirstAdmin', () => {
    it('should create an admin with a hashed password when no user exists', async () => {
      vi.mocked(UsersRepository.hasAnyUser).mockReturnValue(false)

      expect(await AuthService.signUpFirstAdmin('admin', 'secret')).toBe(true)

      const [username, hash] = vi.mocked(UsersRepository.createAdmin).mock.calls[0]
      expect(username).toBe('admin')
      expect(hash).not.toBe('secret')
      expect(await bcrypt.compare('secret', hash)).toBe(true)
    })

    it('should refuse when a user already exists', async () => {
      vi.mocked(UsersRepository.hasAnyUser).mockReturnValue(true)

      expect(await AuthService.signUpFirstAdmin('admin', 'secret')).toBe(false)
      expect(UsersRepository.createAdmin).not.toHaveBeenCalled()
    })
  })

  describe('areCredentialsValid', () => {
    const password_hash = bcrypt.hashSync('secret', 1)

    it('should be true for a matching username and password', async () => {
      vi.mocked(UsersRepository.findByUsername).mockReturnValue({
        id: 1,
        username: 'admin',
        password_hash,
        is_admin: 1
      })
      expect(await AuthService.areCredentialsValid('admin', 'secret')).toBe(true)
    })

    it('should be false for a wrong password', async () => {
      vi.mocked(UsersRepository.findByUsername).mockReturnValue({
        id: 1,
        username: 'admin',
        password_hash,
        is_admin: 1
      })
      expect(await AuthService.areCredentialsValid('admin', 'nope')).toBe(false)
    })

    it('should be false for an unknown user', async () => {
      vi.mocked(UsersRepository.findByUsername).mockReturnValue(undefined)
      expect(await AuthService.areCredentialsValid('ghost', 'secret')).toBe(false)
    })
  })
})

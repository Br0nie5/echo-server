import { beforeEach, describe, it, expect, vi } from 'vitest'

import type { AuthRepository, NewUser } from '../../domain/auth.repository.js'
import { SignUpRefusedError } from '../../domain/signUpRefusedError.js'
import { canSignUp, createSignUpFirstAdmin } from '../signUpFirstAdmin.js'

/** An `AuthRepository` keeping its accounts in memory, which takes a while to store one. */
const createInMemoryAuthRepository = (): AuthRepository & { users: NewUser[] } => {
  const users: NewUser[] = []

  return {
    users,
    hasAnyUser: vi.fn(async () => users.length > 0),
    createUser: vi.fn(async (newUser: NewUser) => {
      await new Promise((resolve) => setTimeout(resolve, 5))
      users.push(newUser)
    }),
    areCredentialsValid: vi.fn()
  }
}

describe('canSignUp', () => {
  it('Should be true as long as there is no account, and false once there is one', async () => {
    const authRepository = createInMemoryAuthRepository()

    expect(await canSignUp(authRepository)).toBe(true)

    await authRepository.createUser({ username: 'admin', password: 'secret', isAdmin: true })

    expect(await canSignUp(authRepository)).toBe(false)
  })
})

describe('createSignUpFirstAdmin', () => {
  let authRepository: ReturnType<typeof createInMemoryAuthRepository>

  beforeEach(() => {
    authRepository = createInMemoryAuthRepository()
  })

  it('Should sign up the user as an admin when there is no account yet', async () => {
    const signUpFirstAdmin = createSignUpFirstAdmin(authRepository)

    await signUpFirstAdmin('admin', 'secret')

    expect(authRepository.users).toEqual([{ username: 'admin', password: 'secret', isAdmin: true }])
  })

  it('Should refuse the sign up when an account already exists', async () => {
    const signUpFirstAdmin = createSignUpFirstAdmin(authRepository)
    await signUpFirstAdmin('admin', 'secret')

    const refusedSignUp = signUpFirstAdmin('other', 'secret')

    await expect(refusedSignUp).rejects.toThrow(SignUpRefusedError)
    await expect(refusedSignUp).rejects.toThrow('An account already exists.')
    expect(authRepository.users).toHaveLength(1)
  })

  it('Should refuse a sign up asked for while another one is in progress', async () => {
    const signUpFirstAdmin = createSignUpFirstAdmin(authRepository)

    const [firstSignUp, secondSignUp] = await Promise.allSettled([
      signUpFirstAdmin('first', 'secret'),
      signUpFirstAdmin('second', 'secret')
    ])

    expect(firstSignUp.status).toBe('fulfilled')
    expect(secondSignUp).toMatchObject({
      status: 'rejected',
      reason: new SignUpRefusedError('Another sign up is in progress.')
    })
    expect(authRepository.users.map(({ username }) => username)).toEqual(['first'])
  })

  it('Should refuse a second sign up even when the account check of the storage is slow', async () => {
    const signUpFirstAdmin = createSignUpFirstAdmin(authRepository)
    // The second check reads the storage before the first account is stored, but answers after.
    vi.mocked(authRepository.hasAnyUser)
      .mockImplementationOnce(async () => false)
      .mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
        return false
      })

    const [firstSignUp, secondSignUp] = await Promise.allSettled([
      signUpFirstAdmin('first', 'secret'),
      signUpFirstAdmin('second', 'secret')
    ])

    expect(firstSignUp.status).toBe('fulfilled')
    expect(secondSignUp.status).toBe('rejected')
    expect(authRepository.users.map(({ username }) => username)).toEqual(['first'])
  })

  it('Should no longer be in progress once a sign up has been refused', async () => {
    const signUpFirstAdmin = createSignUpFirstAdmin(authRepository)
    await signUpFirstAdmin('admin', 'secret')
    await expect(signUpFirstAdmin('other', 'secret')).rejects.toThrow('An account already exists.')

    await expect(signUpFirstAdmin('other', 'secret')).rejects.toThrow('An account already exists.')
  })

  it('Should throw the error of the repository, and accept the next sign up', async () => {
    const signUpFirstAdmin = createSignUpFirstAdmin(authRepository)
    vi.mocked(authRepository.createUser).mockRejectedValueOnce(new Error('SQLITE_BUSY'))

    await expect(signUpFirstAdmin('admin', 'secret')).rejects.toThrow('SQLITE_BUSY')

    await signUpFirstAdmin('admin', 'secret')
    expect(authRepository.users).toHaveLength(1)
  })
})

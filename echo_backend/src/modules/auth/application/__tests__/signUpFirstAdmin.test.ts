import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'

import type { AuthRepository, NewUser } from '../../domain/auth.repository.js'
import { SignUpRefusedError } from '../../domain/signUpRefusedError.js'
import { createSignUpFirstAdmin } from '../signUpFirstAdmin.js'

/** An `AuthRepository` keeping its accounts in memory, which takes a second to store one. */
const createInMemoryAuthRepository = (): AuthRepository & { users: NewUser[] } => {
  const users: NewUser[] = []

  return {
    users,
    hasAnyUser: vi.fn(async () => users.length > 0),
    createUser: vi.fn(async (newUser: NewUser) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      users.push(newUser)
    }),
    areCredentialsValid: vi.fn()
  }
}

describe('createSignUpFirstAdmin', () => {
  let authRepository: ReturnType<typeof createInMemoryAuthRepository>

  beforeEach(() => {
    vi.useFakeTimers()
    authRepository = createInMemoryAuthRepository()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Should refuse a sign up asked for while another one is in progress', async () => {
    const signUpFirstAdmin = createSignUpFirstAdmin(authRepository)

    const signUps = Promise.allSettled([
      signUpFirstAdmin('first', 'secret'),
      signUpFirstAdmin('second', 'secret')
    ])
    await vi.advanceTimersByTimeAsync(1000)
    const [firstSignUp, secondSignUp] = await signUps

    expect(firstSignUp.status).toBe('fulfilled')
    expect(secondSignUp).toMatchObject({
      status: 'rejected',
      reason: new SignUpRefusedError('Another sign up is in progress.')
    })
    expect(authRepository.users.map(({ username }) => username)).toEqual(['first'])
  })

  it('Should no longer be in progress once a sign up has been refused', async () => {
    const signUpFirstAdmin = createSignUpFirstAdmin(authRepository)
    const firstSignUp = signUpFirstAdmin('admin', 'secret')
    await vi.advanceTimersByTimeAsync(1000)
    await firstSignUp
    await expect(signUpFirstAdmin('other', 'secret')).rejects.toThrow('An account already exists.')

    await expect(signUpFirstAdmin('other', 'secret')).rejects.toThrow('An account already exists.')
  })

  it('Should throw the error of the repository, and accept the next sign up', async () => {
    const signUpFirstAdmin = createSignUpFirstAdmin(authRepository)
    vi.mocked(authRepository.createUser).mockRejectedValueOnce(new Error('SQLITE_BUSY'))

    await expect(signUpFirstAdmin('admin', 'secret')).rejects.toThrow('SQLITE_BUSY')

    const nextSignUp = signUpFirstAdmin('admin', 'secret')
    await vi.advanceTimersByTimeAsync(1000)
    await nextSignUp
    expect(authRepository.users).toHaveLength(1)
  })
})

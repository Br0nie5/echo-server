import { describe, it, expect } from 'vitest'

import type { AuthStatus } from '../authStatus.schema.js'
import { AuthStatusSchema } from '../authStatus.schema.js'

describe('AuthStatusSchema', () => {
  it.each<AuthStatus>([
    { status: 'authenticated' },
    { status: 'unauthenticated' },
    { status: 'needsSignUp' }
  ])('Should accept the answer %j', (authStatus) => {
    expect(AuthStatusSchema.parse(authStatus)).toEqual(authStatus)
  })

  it.each([
    { reason: 'without status', answer: {} },
    { reason: 'with a status it does not know', answer: { status: 'loggedOut' } },
    { reason: 'with a status that is not a text', answer: { status: true } },
    {
      reason: 'with a property it does not describe',
      answer: { status: 'authenticated', username: 'admin' }
    },
    { reason: 'that is not an object', answer: 'authenticated' }
  ])('Should refuse an answer $reason', ({ answer }) => {
    expect(AuthStatusSchema.safeParse(answer).success).toBe(false)
  })
})

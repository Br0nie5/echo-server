import { describe, it, expect } from 'vitest'

import { needsSignupMessage } from '../consts.js'

describe('needsSignupMessage', () => {
  it('Should be the message of the 401 answer of the auth check when no account exists yet', () => {
    expect(needsSignupMessage).toBe('No account found.')
  })
})

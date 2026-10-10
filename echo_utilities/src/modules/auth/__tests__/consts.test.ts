import { describe, it, expect } from 'vitest'

import { needsSignupMessage } from '../consts.js'

describe('needsSignupMessage', () => {
  it('Should keep the message the API answers its 401 with when no account exists yet', () => {
    expect(needsSignupMessage).toBe('No account found.')
  })
})

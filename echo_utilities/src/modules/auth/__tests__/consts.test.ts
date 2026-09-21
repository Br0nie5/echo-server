import { describe, it, expect } from 'vitest'

import { needsSignupMessage } from '../consts'

describe('consts', () => {
  it('needsSignupMessage should be a string', () => {
    expect(typeof needsSignupMessage === 'string').toBeTruthy()
  })
})

import { describe, it, expect } from 'vitest'

import { sanitizeServerNameForPath } from '../sanitizeServerNameForPath.js'

describe('sanitizeServerNameForPath', () => {
  it('should leave a safe name unchanged', () => {
    expect(sanitizeServerNameForPath('Echo prod-01_test')).toBe('Echo prod-01_test')
  })

  it('should replace slashes', () => {
    expect(sanitizeServerNameForPath('a/b')).toBe('a_b')
  })

  it('should replace path traversal sequences', () => {
    expect(sanitizeServerNameForPath('../../etc')).toBe('______etc')
  })

  it('should replace other unsafe characters', () => {
    expect(sanitizeServerNameForPath('name!@#$%^&*()')).toBe('name__________')
  })
})

import { describe, it, expect, vi } from 'vitest'

import { validateCredentials } from '../validateCredentials.js'

const authRepository = { hasAnyUser: vi.fn(), createUser: vi.fn(), areCredentialsValid: vi.fn() }

describe('validateCredentials', () => {
  it.each([true, false])(
    'should be %s when the validity of the credentials is',
    async (areCredentialsValid) => {
      authRepository.areCredentialsValid.mockResolvedValueOnce(areCredentialsValid)

      expect(await validateCredentials(authRepository, 'admin', 'secret')).toBe(areCredentialsValid)
      expect(authRepository.areCredentialsValid).toHaveBeenCalledWith('admin', 'secret')
    }
  )
})

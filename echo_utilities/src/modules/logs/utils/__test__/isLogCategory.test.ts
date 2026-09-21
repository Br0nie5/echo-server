import { describe, it, expect } from 'vitest'

import { LogCategory } from '../../types/__generated__/logCategory'
import { isLogCategory } from '../isLogCategory'

describe('isLogCategory', () => {
  it('should return true if string is a log category', () => {
    Object.values(LogCategory).forEach((category) => {
      expect(isLogCategory(category as string)).toBeTruthy()
    })
  })

  it('should return false if string is not a log category', () => {
    expect(isLogCategory('Not a log category')).toBeFalsy()
  })
})

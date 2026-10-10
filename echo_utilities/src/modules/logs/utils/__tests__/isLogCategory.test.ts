import { describe, it, expect } from 'vitest'

import { LogCategory } from '../../schemas/logCategory.schema.js'
import { isLogCategory } from '../isLogCategory.js'

describe('isLogCategory', () => {
  it('Should return true if string is a log category', () => {
    Object.values(LogCategory).forEach((category) => {
      expect(isLogCategory(category)).toBeTruthy()
    })
  })

  it('Should return false if string is not a log category', () => {
    expect(isLogCategory('Not a log category')).toBeFalsy()
  })
})

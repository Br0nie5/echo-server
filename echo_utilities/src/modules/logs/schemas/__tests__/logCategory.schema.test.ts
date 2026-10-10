import { describe, it, expect } from 'vitest'

import { LogCategory, LogCategorySchema } from '../logCategory.schema.js'

describe('LogCategorySchema', () => {
  it('Should accept every LogCategory value', () => {
    Object.values(LogCategory).forEach((category) => {
      expect(LogCategorySchema.safeParse(category).success).toBeTruthy()
    })
  })

  it('Should reject a string that is not a LogCategory', () => {
    expect(LogCategorySchema.safeParse('NOT_A_CATEGORY').success).toBeFalsy()
  })
})

describe('LogCategory', () => {
  it('Should give every severity by its name', () => {
    expect(LogCategory).toEqual({
      SUCCESS: 'SUCCESS',
      INFO: 'INFO',
      WARNING: 'WARNING',
      ERROR: 'ERROR'
    })
  })
})

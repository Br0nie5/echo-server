import { describe, it, expect } from 'vitest'

import { getInvalidDateFieldMessage } from '../getInvalidDateFieldMessage.js'

describe('getInvalidDateFieldMessage', () => {
  it('Should name the field that is not a date', () => {
    expect(getInvalidDateFieldMessage('startDate')).toBe(
      'Field startDate is not a valid date, it should be an ISO string'
    )
  })
})

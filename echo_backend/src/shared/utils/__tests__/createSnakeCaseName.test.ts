import { describe, it, expect } from 'vitest'

import { createSnakeCaseName } from '../createSnakeCaseName.js'

describe('createSnakeCaseName', () => {
  it.each([
    { reason: 'one part', nameParts: ['billing'], name: 'billing' },
    {
      reason: 'several parts, joined in their order',
      nameParts: ['billing', 'exports'],
      name: 'billing_exports'
    },
    {
      reason: 'parts with capital letters, in lower case',
      nameParts: ['Billing', 'EXPORTS'],
      name: 'billing_exports'
    },
    {
      reason: 'parts with spaces, each replaced',
      nameParts: ['Shop  Prod', ' daily '],
      name: 'shop__prod__daily_'
    }
  ])('Should give $name for $reason', ({ nameParts, name }) => {
    expect(createSnakeCaseName(nameParts)).toBe(name)
  })

  it('Should give no name when there is no part', () => {
    expect(createSnakeCaseName([])).toBeUndefined()
  })
})

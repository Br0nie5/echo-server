import { describe, expect, it } from 'vitest'

import { getSchemaReference } from '../getSchemaReference.js'

describe('getSchemaReference', () => {
  it.each([
    { jsonSchema: { $id: 'Log' }, index: 0, reference: 'Log' },
    { jsonSchema: { $id: 'EchoError', type: 'object' }, index: 2, reference: 'EchoError' }
  ])('Should name $jsonSchema after its $id', ({ jsonSchema, index, reference }) => {
    expect(getSchemaReference(jsonSchema, index)).toBe(reference)
  })

  it.each([
    { jsonSchema: {}, index: 3, reference: 'def-3' },
    { jsonSchema: { $id: '' }, index: 0, reference: 'def-0' },
    { jsonSchema: { type: 'string' }, index: 12, reference: 'def-12' }
  ])(
    'Should name $jsonSchema, which has no $id, after its position $index',
    ({ jsonSchema, index, reference }) => {
      expect(getSchemaReference(jsonSchema, index)).toBe(reference)
    }
  )
})

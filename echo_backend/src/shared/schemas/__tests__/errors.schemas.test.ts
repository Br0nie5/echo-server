import { describe, it, expect } from 'vitest'

import { EchoErrorJsonSchema } from '../errors.schemas.js'

describe('EchoErrorJsonSchema', () => {
  it('Should be a JSON schema of draft 7, named EchoError for the routes to refer to it', () => {
    expect(EchoErrorJsonSchema).toMatchObject({
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'EchoError',
      type: 'object',
      required: ['statusCode', 'message']
    })
  })
})

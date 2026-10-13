import { describe, it, expect } from 'vitest'

import { logSearchableKeys } from '../logSearchableKeys.js'

describe('logSearchableKeys', () => {
  it('Should be the job, the location name, the message and the group name', () => {
    expect(logSearchableKeys).toEqual(['jobId', 'locationName', 'message', 'groupName'])
  })
})

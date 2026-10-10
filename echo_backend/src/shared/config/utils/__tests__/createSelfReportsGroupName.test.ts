import { describe, it, expect } from 'vitest'

import { createSelfReportsGroupName } from '../createSelfReportsGroupName.js'

describe('createSelfReportsGroupName', () => {
  it('Should keep the letters, digits, dashes, underscores and spaces of the server name', () => {
    expect(createSelfReportsGroupName('Docker-Prod_1 a')).toBe('Docker-Prod_1 a')
  })

  it('Should make the server name safe for a path', () => {
    expect(createSelfReportsGroupName('../Docker Prod/1!')).toBe('___Docker Prod_1_')
  })
})

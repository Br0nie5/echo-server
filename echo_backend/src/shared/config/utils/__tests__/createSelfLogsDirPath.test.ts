import { describe, it, expect } from 'vitest'

import { createSelfLogsDirPath } from '../createSelfLogsDirPath.js'

describe('createSelfLogsDirPath', () => {
  it('should put the self logs of the server inside the logs directory', () => {
    expect(createSelfLogsDirPath('/some/path', 'Echo')).toBe('/some/path/server/Echo/log')
  })

  it('should keep the letters, digits, dashes, underscores and spaces of the server name', () => {
    expect(createSelfLogsDirPath('/some/path', 'Docker-Prod_1 a')).toBe(
      '/some/path/server/Docker-Prod_1 a/log'
    )
  })

  it('should make the server name safe for the path', () => {
    expect(createSelfLogsDirPath('/some/path', '../Docker Prod/1!')).toBe(
      '/some/path/server/___Docker Prod_1_/log'
    )
  })
})

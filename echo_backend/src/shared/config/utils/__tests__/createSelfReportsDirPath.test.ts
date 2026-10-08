import { describe, it, expect } from 'vitest'

import { createSelfReportsDirPath } from '../createSelfReportsDirPath.js'

describe('createSelfReportsDirPath', () => {
  it('should put the self reports of the server inside the logs directory', () => {
    expect(createSelfReportsDirPath('/some/path', 'Echo')).toBe('/some/path/server/Echo/log')
  })

  it('should keep the letters, digits, dashes, underscores and spaces of the server name', () => {
    expect(createSelfReportsDirPath('/some/path', 'Docker-Prod_1 a')).toBe(
      '/some/path/server/Docker-Prod_1 a/log'
    )
  })

  it('should make the server name safe for the path', () => {
    expect(createSelfReportsDirPath('/some/path', '../Docker Prod/1!')).toBe(
      '/some/path/server/___Docker Prod_1_/log'
    )
  })
})

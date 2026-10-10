import { describe, it, expect } from 'vitest'

import { createSelfReportsDirPath } from '../createSelfReportsDirPath.js'

describe('createSelfReportsDirPath', () => {
  it('Should put the self reports of the group inside the server logs directory', () => {
    expect(createSelfReportsDirPath('/some/path', 'Echo', 'log')).toBe(
      '/some/path/self_reports/Echo/log'
    )
  })
})

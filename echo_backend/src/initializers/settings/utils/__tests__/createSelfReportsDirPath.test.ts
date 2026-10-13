import { describe, it, expect } from 'vitest'

import { createSelfReportsDirPath } from '../createSelfReportsDirPath.js'

describe('createSelfReportsDirPath', () => {
  it.each([
    {
      reason:
        'put the self reports of the server in its directory of the self reports root directory',
      serverName: 'Echo',
      selfReportsDirPath: '/self_reports/Echo'
    },
    {
      reason: 'keep the letters, digits, dashes, underscores and spaces of the server name',
      serverName: 'Shop-Prod_1 a',
      selfReportsDirPath: '/self_reports/Shop-Prod_1 a'
    },
    {
      reason: 'make the server name safe for a path',
      serverName: '../Shop Prod/1!',
      selfReportsDirPath: '/self_reports/___Shop Prod_1_'
    }
  ])('Should $reason', ({ serverName, selfReportsDirPath }) => {
    expect(createSelfReportsDirPath('/self_reports', serverName)).toBe(selfReportsDirPath)
  })
})

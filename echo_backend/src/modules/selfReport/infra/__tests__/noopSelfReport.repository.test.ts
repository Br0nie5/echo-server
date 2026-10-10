import { describe, expect, it } from 'vitest'

import { createNoopSelfReportRepository } from '../noopSelfReport.repository.js'

describe('createNoopSelfReportRepository', () => {
  it('Should store nothing', async () => {
    const selfReportRepository = createNoopSelfReportRepository()

    await expect(
      selfReportRepository.saveSelfReports([
        {
          date: new Date('2026-09-19T14:41:09.669Z'),
          message: 'bad line',
          level: 'warning',
          reportedFile: 'someFile',
          reportedLine: 3
        }
      ])
    ).resolves.toBeUndefined()
  })
})

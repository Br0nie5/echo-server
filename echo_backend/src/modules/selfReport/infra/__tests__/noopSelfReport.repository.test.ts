import { describe, expect, it } from 'vitest'

import { createNoopSelfReportRepository } from '../noopSelfReport.repository.js'

describe('createNoopSelfReportRepository', () => {
  it('Should store nothing', async () => {
    const selfReportRepository = createNoopSelfReportRepository()

    await expect(
      selfReportRepository.saveSelfReports([
        {
          id: '2026-09-19T14:41:09.669Z bad line WARNING /server/billing/logs/send_invoices.jsonl:3',
          date: new Date('2026-09-19T14:41:09.669Z'),
          message: 'bad line',
          level: 'WARNING',
          origin: '/server/billing/logs/send_invoices.jsonl:3'
        }
      ])
    ).resolves.toBeUndefined()
  })
})

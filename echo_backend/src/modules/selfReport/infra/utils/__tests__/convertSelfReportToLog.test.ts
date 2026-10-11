import { describe, it, expect } from 'vitest'

import type { SelfReport } from '../../../domain/selfReport.js'
import { convertSelfReportToLog, type SelfReportLogContext } from '../convertSelfReportToLog.js'

const selfReport = (overrides: Partial<SelfReport> = {}): SelfReport => ({
  id: 'someSelfReportId',
  date: new Date('2026-09-19T14:41:09.669Z'),
  message: 'bad line',
  level: 'WARNING',
  origin: 'someFile:4',
  ...overrides
})

const context: SelfReportLogContext = {
  jobId: 5,
  location: '/server_logs/self_reports/Echo/log/parseLogFile.jsonl',
  locationName: 'parseLogFile',
  groupName: 'Echo'
}

describe('convertSelfReportToLog', () => {
  it('Should build the log a self report is stored as, from the self report and its context', () => {
    expect(convertSelfReportToLog(selfReport(), context)).toEqual({
      id: 'someSelfReportId',
      location: '/server_logs/self_reports/Echo/log/parseLogFile.jsonl',
      locationName: 'parseLogFile',
      groupName: 'Echo',
      date: '2026-09-19T14:41:09.669Z',
      jobId: 5,
      category: 'WARNING',
      message: 'bad line',
      origin: 'someFile:4'
    })
  })

  it('Should store an error with the ERROR category', () => {
    expect(convertSelfReportToLog(selfReport({ level: 'ERROR' }), context).category).toBe('ERROR')
  })
})

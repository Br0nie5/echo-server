import { describe, it, expect } from 'vitest'

import type { SelfReport } from '../../../domain/selfReport.js'
import { convertSelfReportToLog, type SelfReportLogContext } from '../convertSelfReportToLog.js'

const selfReport = (overrides: Partial<SelfReport> = {}): SelfReport => ({
  date: new Date('2026-09-19T14:41:09.669Z'),
  message: 'bad line',
  level: 'warning',
  reportedFile: 'someFile',
  reportedLine: 4,
  ...overrides
})

const context: SelfReportLogContext = {
  jobId: 5,
  location: '/server_logs/self_reports/Echo/log/parseLogFile.jsonl',
  locationName: 'parseLogFile',
  groupName: 'Echo'
}

describe('convertSelfReportToLog', () => {
  it('should build the log a self report is stored as, from the self report and its context', () => {
    expect(convertSelfReportToLog(selfReport(), context)).toEqual({
      id: '/server_logs/self_reports/Echo/log/parseLogFile.jsonl Echo parseLogFile 5 2026-09-19T14:41:09.669Z WARNING someFile 4 bad line',
      location: '/server_logs/self_reports/Echo/log/parseLogFile.jsonl',
      locationName: 'parseLogFile',
      groupName: 'Echo',
      date: '2026-09-19T14:41:09.669Z',
      jobId: 5,
      category: 'WARNING',
      message: 'bad line',
      callFile: 'someFile',
      callLine: 4
    })
  })

  it('should store an error with the ERROR category', () => {
    expect(convertSelfReportToLog(selfReport({ level: 'error' }), context).category).toBe('ERROR')
  })

  it('should store 0 as the line of a self report that has no reported line', () => {
    expect(convertSelfReportToLog(selfReport({ reportedLine: undefined }), context).callLine).toBe(
      0
    )
  })

  it('should give different ids to self reports that differ', () => {
    expect(convertSelfReportToLog(selfReport(), context).id).not.toBe(
      convertSelfReportToLog(selfReport({ message: 'other line' }), context).id
    )
  })
})

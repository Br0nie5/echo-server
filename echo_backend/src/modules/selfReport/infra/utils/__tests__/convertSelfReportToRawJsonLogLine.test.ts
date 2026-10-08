import { describe, it, expect } from 'vitest'

import type { SelfReport } from '../../../domain/selfReport.js'
import { convertSelfReportToRawJsonLogLine } from '../convertSelfReportToRawJsonLogLine.js'

const selfReport = (overrides: Partial<SelfReport> = {}): SelfReport => ({
  date: new Date('2026-09-19T14:41:09.669Z'),
  message: 'bad line',
  level: 'warning',
  reportedFile: 'someFile',
  reportedLine: 4,
  ...overrides
})

describe('convertSelfReportToRawJsonLogLine', () => {
  it('should build the JSON of a log line from the self report and the job', () => {
    expect(convertSelfReportToRawJsonLogLine(selfReport(), 5)).toEqual({
      job_id: 5,
      timestamp: '2026-09-19T14:41:09.669Z',
      status: 'WARNING',
      message: 'bad line',
      call_file: 'someFile',
      call_line: 4
    })
  })

  it('should write an error with the ERROR status', () => {
    expect(convertSelfReportToRawJsonLogLine(selfReport({ level: 'error' }), 5).status).toBe(
      'ERROR'
    )
  })
})

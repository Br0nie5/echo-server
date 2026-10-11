import { createLogWithIds } from '@echo/utilities'
import { describe, it, expect } from 'vitest'

import type { SelfReport } from '../../../domain/selfReport.js'
import { convertSelfReportToLog, type SelfReportLogContext } from '../convertSelfReportToLog.js'

const selfReport = (overrides: Partial<SelfReport> = {}): SelfReport => ({
  id: 'someSelfReportId',
  date: new Date('2026-09-19T14:41:09.669Z'),
  message: 'bad line',
  level: 'WARNING',
  origin: '/server/docker_utils/logs/prune_images.jsonl:4',
  ...overrides
})

const context: SelfReportLogContext = {
  jobId: 5,
  location: '/server_logs/self_reports/Echo/logs/parseLogFile.jsonl',
  locationName: 'parseLogFile',
  groupName: 'Echo'
}

describe('convertSelfReportToLog', () => {
  it('Should build the log a self report is stored as, from the self report and its context', () => {
    expect(convertSelfReportToLog(selfReport(), context, 2)).toEqual(
      createLogWithIds(
        {
          location: '/server_logs/self_reports/Echo/logs/parseLogFile.jsonl',
          locationName: 'parseLogFile',
          groupName: 'Echo',
          date: '2026-09-19T14:41:09.669Z',
          jobId: 5,
          level: 'WARNING',
          message: 'bad line',
          origin: '/server/docker_utils/logs/prune_images.jsonl:4'
        },
        2
      )
    )
  })

  it('Should store an error with the ERROR level', () => {
    expect(convertSelfReportToLog(selfReport({ level: 'ERROR' }), context, 0).level).toBe('ERROR')
  })
})

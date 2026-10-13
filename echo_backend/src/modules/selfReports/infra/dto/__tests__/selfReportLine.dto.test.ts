import { describe, expect, it } from 'vitest'

import type { SelfReport, SelfReportsSession } from '../../../domain/selfReport.js'
import {
  convertSelfReportLineToSelfReport,
  convertSelfReportToSelfReportLine
} from '../selfReportLine.dto.js'

const storage = {
  location: '/self_reports/Echo/parseLogs.jsonl',
  locationName: 'parseLogs',
  groupName: 'self_reports_Echo'
}

const selfReport: SelfReport & SelfReportsSession = {
  ...storage,
  sessionId: 4,
  date: new Date('2026-10-01T08:00:00.000Z'),
  level: 'WARNING',
  message: 'bad line',
  origin: '/server/billing/logs/send_invoices.jsonl:3'
}

const line =
  '{"sessionId":4,"date":"2026-10-01T08:00:00.000Z","level":"WARNING","message":"bad line","origin":"/server/billing/logs/send_invoices.jsonl:3"}'

// A self report stored and read back is tested through the server (`logs.routes.test.ts`). Here is
// every line that holds no self report, which the server never writes.
describe('convertSelfReportLineToSelfReport', () => {
  it('Should convert a valid line to the self report it holds, stored at the storage', () => {
    expect(convertSelfReportLineToSelfReport(line, storage)).toEqual(selfReport)
  })

  it.each([
    ['is not JSON', 'not a self report'],
    ['is not an object', '"not a self report"'],
    [
      'has no sessionId',
      '{"date":"2026-10-01T08:00:00.000Z","level":"WARNING","message":"bad line","origin":"send_invoices.jsonl:3"}'
    ],
    [
      'has a sessionId that is not an integer',
      '{"sessionId":1.5,"date":"2026-10-01T08:00:00.000Z","level":"WARNING","message":"bad line","origin":"send_invoices.jsonl:3"}'
    ],
    [
      'has a date that is not a date',
      '{"sessionId":4,"date":"9999-99-99T25:61:61.999Z","level":"WARNING","message":"bad line","origin":"send_invoices.jsonl:3"}'
    ],
    [
      'has a level a self report cannot have',
      '{"sessionId":4,"date":"2026-10-01T08:00:00.000Z","level":"INFO","message":"bad line","origin":"send_invoices.jsonl:3"}'
    ],
    [
      'has no message',
      '{"sessionId":4,"date":"2026-10-01T08:00:00.000Z","level":"WARNING","origin":"send_invoices.jsonl:3"}'
    ],
    [
      'has an empty origin',
      '{"sessionId":4,"date":"2026-10-01T08:00:00.000Z","level":"WARNING","message":"bad line","origin":""}'
    ],
    [
      'has no origin',
      '{"sessionId":4,"date":"2026-10-01T08:00:00.000Z","level":"WARNING","message":"bad line"}'
    ]
  ])('Should return undefined for a line that %s', (_, invalidLine) => {
    expect(convertSelfReportLineToSelfReport(invalidLine, storage)).toBeUndefined()
  })
})

describe('convertSelfReportToSelfReportLine', () => {
  it('Should give the line of the self report, without what says where it is stored', () => {
    expect(convertSelfReportToSelfReportLine(selfReport)).toBe(line)
  })
})

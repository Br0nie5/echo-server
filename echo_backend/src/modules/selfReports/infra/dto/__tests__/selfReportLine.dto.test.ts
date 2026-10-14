import { describe, expect, it } from 'vitest'

import { convertSelfReportLineToSelfReport } from '../selfReportLine.dto.js'

/** Where the lines of the tests are stored. */
const lineLocation = {
  location: '/self_reports/Echo/parseLogs.jsonl',
  locationName: 'parseLogs',
  groupName: 'self_reports_echo'
}

describe('convertSelfReportLineToSelfReport', () => {
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
    expect(convertSelfReportLineToSelfReport(invalidLine, lineLocation)).toBeUndefined()
  })
})

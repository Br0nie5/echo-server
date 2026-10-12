import { createLogWithIds, LogLevel, type Log } from '@echo/utilities'
import { describe, it, expect } from 'vitest'

import { convertRawLogLineToLog, type RawLogLineDto } from '../rawLogLine.dto.js'

const rawLogLine = (content: string): RawLogLineDto => ({
  logFile: {
    path: '/server/billing/logs/count_stock.jsonl',
    fileName: 'count_stock',
    groupName: 'billing'
  },
  index: 0,
  content
})

/** What the valid line of the tests holds, in the log file of `rawLogLine`. */
const noIdsLog: Omit<Log, 'id' | 'contentId'> = {
  date: '2024-05-12T14:30:00.386Z',
  groupName: 'billing',
  location: '/server/billing/logs/count_stock.jsonl',
  locationName: 'count_stock',
  jobId: 123,
  level: LogLevel.INFO,
  message: 'Something happened',
  origin: '/server/billing/count_stock.sh:4'
}

describe('convertRawLogLineToLog', () => {
  it('Should convert a valid line to a log', () => {
    const content =
      '{"jobId":123,"timestamp":"2024-05-12T14:30:00.386Z","level":"INFO","message":"Something happened","origin":"/server/billing/count_stock.sh:4"}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toEqual(
      createLogWithIds(noIdsLog, rawLogLine(content).index)
    )
  })

  it('Should convert a valid line without origin to a log without origin', () => {
    const content =
      '{"jobId":123,"timestamp":"2024-05-12T14:30:00.386Z","level":"INFO","message":"Something happened"}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toEqual(
      createLogWithIds({ ...noIdsLog, origin: undefined }, rawLogLine(content).index)
    )
  })

  it('Should return undefined for an empty origin', () => {
    const content =
      '{"jobId":1,"timestamp":"2024-05-12T14:30:00.012Z","level":"INFO","message":"No origin","origin":""}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toBeUndefined()
  })

  it('Should return undefined for a line that is not JSON', () => {
    expect(convertRawLogLineToLog(rawLogLine('Not matching the pattern'))).toBeUndefined()
  })

  it('Should return undefined for an invalid level', () => {
    const content =
      '{"jobId":1,"timestamp":"2024-05-12T14:30:00.012Z","level":"INVALID","message":"Bad level","origin":"/server/billing/count_stock.sh:1"}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toBeUndefined()
  })

  it('Should return undefined for an invalid date', () => {
    const content =
      '{"jobId":1,"timestamp":"9999-99-99T25:61:61.999Z","level":"INFO","message":"Impossible date","origin":"/server/billing/count_stock.sh:1"}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toBeUndefined()
  })

  it('Should return undefined for a JSON object with an unexpected shape', () => {
    const content =
      '{"jobId":1,"timestamp":"2024-05-12T14:30:00.012Z","level":"INFO","invalid_message_key":"No message"}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toBeUndefined()
  })
})

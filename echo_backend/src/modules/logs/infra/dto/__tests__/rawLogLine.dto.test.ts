import { createLogWithIds, LogCategory, type Log } from '@echo/utilities'
import { describe, it, expect } from 'vitest'

import { convertRawLogLineToLog, type RawLogLineDto } from '../rawLogLine.dto.js'

const rawLogLine = (content: string): RawLogLineDto => ({
  logFile: {
    path: '/server/docker_utils/log/check_logs.jsonl',
    fileName: 'check_logs',
    groupName: 'docker_utils'
  },
  index: 0,
  content
})

/** What the valid line of the tests holds, in the log file of `rawLogLine`. */
const noIdsLog: Omit<Log, 'id' | 'contentId'> = {
  date: '2024-05-12T14:30:00.386Z',
  groupName: 'docker_utils',
  location: '/server/docker_utils/log/check_logs.jsonl',
  locationName: 'check_logs',
  jobId: 123,
  category: LogCategory.INFO,
  message: 'Something happened',
  origin: '/server/docker_utils/check_logs.sh:4'
}

describe('convertRawLogLineToLog', () => {
  it('Should convert a valid line to a log', () => {
    const content =
      '{"job_id":123,"timestamp":"2024-05-12T14:30:00.386Z","status":"INFO","message":"Something happened","origin":"/server/docker_utils/check_logs.sh:4"}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toEqual(
      createLogWithIds(noIdsLog, rawLogLine(content).index)
    )
  })

  it('Should convert a valid line without origin to a log without origin', () => {
    const content =
      '{"job_id":123,"timestamp":"2024-05-12T14:30:00.386Z","status":"INFO","message":"Something happened"}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toEqual(
      createLogWithIds({ ...noIdsLog, origin: undefined }, rawLogLine(content).index)
    )
  })

  it('Should return undefined for an empty origin', () => {
    const content =
      '{"job_id":1,"timestamp":"2024-05-12T14:30:00.012Z","status":"INFO","message":"No origin","origin":""}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toBeUndefined()
  })

  it('Should return undefined for a line that is not JSON', () => {
    expect(convertRawLogLineToLog(rawLogLine('Not matching the pattern'))).toBeUndefined()
  })

  it('Should return undefined for an invalid category', () => {
    const content =
      '{"job_id":1,"timestamp":"2024-05-12T14:30:00.012Z","status":"INVALID","message":"Bad category","origin":"/server/docker_utils/check_logs.sh:1"}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toBeUndefined()
  })

  it('Should return undefined for an invalid date', () => {
    const content =
      '{"job_id":1,"timestamp":"9999-99-99T25:61:61.999Z","status":"INFO","message":"Impossible date","origin":"/server/docker_utils/check_logs.sh:1"}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toBeUndefined()
  })

  it('Should return undefined for a JSON object with an unexpected shape', () => {
    const content =
      '{"job_id":1,"timestamp":"2024-05-12T14:30:00.012Z","status":"INFO","invalid_message_key":"No message"}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toBeUndefined()
  })
})

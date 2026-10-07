import { LogCategory } from '@echo/utilities'
import { describe, it, expect } from 'vitest'

import { convertRawLogLineToLog, type RawLogLineDto } from '../rawLogLine.dto.js'

const rawLogLine = (content: string): RawLogLineDto => ({
  logFile: { path: '/logs/myGroup/file1.jsonl', fileName: 'file1', groupName: 'myGroup' },
  index: 0,
  content
})

describe('convertRawLogLineToLog', () => {
  it('should convert a valid line to a log', () => {
    const content =
      '{"job_id":123,"timestamp":"2024-05-12T14:30:00.386Z","status":"INFO","message":"Something happened","call_file":"check_logs.sh","call_line":4}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toEqual({
      id: `0 [myGroup] [file1] ${content}`,
      date: '2024-05-12T14:30:00.386Z',
      groupName: 'myGroup',
      fileName: 'file1',
      jobId: 123,
      category: LogCategory.INFO,
      message: 'Something happened',
      callFile: 'check_logs.sh',
      callLine: 4
    })
  })

  it('should return undefined for a line that is not JSON', () => {
    expect(convertRawLogLineToLog(rawLogLine('Not matching the pattern'))).toBeUndefined()
  })

  it('should return undefined for an invalid category', () => {
    const content =
      '{"job_id":1,"timestamp":"2024-05-12T14:30:00.012Z","status":"INVALID","message":"Bad category","call_file":"f.sh","call_line":1}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toBeUndefined()
  })

  it('should return undefined for an invalid date', () => {
    const content =
      '{"job_id":1,"timestamp":"9999-99-99T25:61:61.999Z","status":"INFO","message":"Impossible date","call_file":"f.sh","call_line":1}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toBeUndefined()
  })

  it('should return undefined for a JSON object with an unexpected shape', () => {
    const content =
      '{"job_id":1,"timestamp":"2024-05-12T14:30:00.012Z","status":"INFO","invalid_message_key":"No message"}'

    expect(convertRawLogLineToLog(rawLogLine(content))).toBeUndefined()
  })
})

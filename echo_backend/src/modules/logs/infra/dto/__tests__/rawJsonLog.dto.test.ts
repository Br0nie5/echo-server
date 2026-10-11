import type { Log } from '@echo/utilities'
import { describe, it, expect } from 'vitest'

import { convertLogToRawJsonLogLine, RawJsonLogLineSchema } from '../rawJsonLog.dto.js'
import { convertRawLogLineToLog } from '../rawLogLine.dto.js'

describe('RawJsonLogLineSchema', () => {
  it('Should accept a valid raw JSON log line', () => {
    const rawLine = {
      job_id: 1,
      timestamp: '2024-05-12T14:30:00.386Z',
      status: 'WARNING',
      message: 'Ok',
      origin: 'check_logs.sh:4'
    }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeTruthy()
  })

  it('Should accept a raw JSON log line without the optional origin', () => {
    const rawLine = {
      job_id: 1,
      timestamp: '2024-05-12T14:30:00.386Z',
      status: 'WARNING',
      message: 'Ok'
    }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeTruthy()
  })

  it('Should reject a raw JSON log line with an empty origin', () => {
    const rawLine = {
      job_id: 1,
      timestamp: '2024-05-12T14:30:00.386Z',
      status: 'WARNING',
      message: 'Ok',
      origin: ''
    }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeFalsy()
  })

  it('Should reject a raw log line missing a required field', () => {
    const rawLine = { job_id: 1, timestamp: '2024-05-12T14:30:00.386Z', status: 'INFO' }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeFalsy()
  })

  it('Should reject a raw log line with a non-number job_id', () => {
    const rawLine = {
      job_id: '1',
      timestamp: '2024-05-12T14:30:00.386Z',
      status: 'INFO',
      message: 'Ok',
      origin: 'check_logs.sh:4'
    }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeFalsy()
  })

  it('Should reject a non-object value', () => {
    expect(RawJsonLogLineSchema.safeParse('not an object').success).toBeFalsy()
  })
})

describe('convertLogToRawJsonLogLine', () => {
  const log: Log = {
    id: 'whatever',
    location: '/logs/myGroup/file1.jsonl',
    locationName: 'file1',
    groupName: 'myGroup',
    date: '2024-05-12T14:30:00.386Z',
    jobId: 123,
    category: 'INFO',
    message: 'Something happened',
    origin: 'check_logs.sh:4'
  }

  it('Should give the JSON of the line of the log, without what says where it is stored', () => {
    expect(convertLogToRawJsonLogLine(log)).toEqual({
      job_id: 123,
      timestamp: '2024-05-12T14:30:00.386Z',
      status: 'INFO',
      message: 'Something happened',
      origin: 'check_logs.sh:4'
    })
  })

  it('Should give a line that is read back as the same log, with the id of its line', () => {
    const content = JSON.stringify(convertLogToRawJsonLogLine(log))

    expect(
      convertRawLogLineToLog({
        logFile: {
          id: '/logs/myGroup/file1.jsonl',
          path: '/logs/myGroup/file1.jsonl',
          fileName: 'file1',
          groupName: 'myGroup'
        },
        index: 0,
        content
      })
    ).toEqual({ ...log, id: `0 /logs/myGroup/file1.jsonl ${content}` })
  })

  it('Should give a line without origin for a log that has none', () => {
    const logWithoutOrigin: Log = { ...log, origin: undefined }

    expect(JSON.stringify(convertLogToRawJsonLogLine(logWithoutOrigin))).toBe(
      '{"job_id":123,"timestamp":"2024-05-12T14:30:00.386Z","status":"INFO","message":"Something happened"}'
    )
  })
})

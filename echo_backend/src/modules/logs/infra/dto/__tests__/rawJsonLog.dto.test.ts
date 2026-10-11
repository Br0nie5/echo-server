import { createLogWithIds, type Log } from '@echo/utilities'
import { describe, it, expect } from 'vitest'

import { convertLogToRawJsonLogLine, RawJsonLogLineSchema } from '../rawJsonLog.dto.js'
import { convertRawLogLineToLog } from '../rawLogLine.dto.js'

describe('RawJsonLogLineSchema', () => {
  it('Should accept a valid raw JSON log line', () => {
    const rawLine = {
      jobId: 1,
      timestamp: '2024-05-12T14:30:00.386Z',
      level: 'WARNING',
      message: 'Ok',
      origin: '/server/docker_utils/check_logs.sh:4'
    }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeTruthy()
  })

  it('Should accept a raw JSON log line without the optional origin', () => {
    const rawLine = {
      jobId: 1,
      timestamp: '2024-05-12T14:30:00.386Z',
      level: 'WARNING',
      message: 'Ok'
    }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeTruthy()
  })

  it('Should reject a raw JSON log line with an empty origin', () => {
    const rawLine = {
      jobId: 1,
      timestamp: '2024-05-12T14:30:00.386Z',
      level: 'WARNING',
      message: 'Ok',
      origin: ''
    }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeFalsy()
  })

  it('Should reject a raw log line missing a required field', () => {
    const rawLine = { jobId: 1, timestamp: '2024-05-12T14:30:00.386Z', level: 'INFO' }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeFalsy()
  })

  it('Should reject a raw log line with a non-number jobId', () => {
    const rawLine = {
      jobId: '1',
      timestamp: '2024-05-12T14:30:00.386Z',
      level: 'INFO',
      message: 'Ok',
      origin: '/server/docker_utils/check_logs.sh:4'
    }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeFalsy()
  })

  it('Should reject a non-object value', () => {
    expect(RawJsonLogLineSchema.safeParse('not an object').success).toBeFalsy()
  })
})

describe('convertLogToRawJsonLogLine', () => {
  const log: Log = createLogWithIds(
    {
      location: '/server/docker_utils/log/check_logs.jsonl',
      locationName: 'check_logs',
      groupName: 'docker_utils',
      date: '2024-05-12T14:30:00.386Z',
      jobId: 123,
      level: 'INFO',
      message: 'Something happened',
      origin: '/server/docker_utils/check_logs.sh:4'
    },
    0
  )

  it('Should give the JSON of the line of the log, without its ids nor what says where it is stored', () => {
    expect(convertLogToRawJsonLogLine(log)).toEqual({
      jobId: 123,
      timestamp: '2024-05-12T14:30:00.386Z',
      level: 'INFO',
      message: 'Something happened',
      origin: '/server/docker_utils/check_logs.sh:4'
    })
  })

  it('Should give a line that is read back as the same log, when it is at the position of its id', () => {
    const content = JSON.stringify(convertLogToRawJsonLogLine(log))

    expect(
      convertRawLogLineToLog({
        logFile: {
          path: '/server/docker_utils/log/check_logs.jsonl',
          fileName: 'check_logs',
          groupName: 'docker_utils'
        },
        index: 0,
        content
      })
    ).toEqual(log)
  })

  it('Should give a line without origin for a log that has none', () => {
    const logWithoutOrigin: Log = { ...log, origin: undefined }

    expect(JSON.stringify(convertLogToRawJsonLogLine(logWithoutOrigin))).toBe(
      '{"jobId":123,"timestamp":"2024-05-12T14:30:00.386Z","level":"INFO","message":"Something happened"}'
    )
  })
})

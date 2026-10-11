import { describe, it, expect } from 'vitest'

import { createLogWithIds } from '../../utils/createLogWithIds.js'
import type { Log } from '../log.schema.js'
import { LogArraySchema, LogSchema } from '../log.schema.js'
import { LogLevel } from '../logLevel.schema.js'

const validLog: Log = createLogWithIds(
  {
    date: '2026-04-28T10:00:00.000Z',
    groupName: 'docker_utils',
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 66,
    level: LogLevel.INFO,
    message: 'Finished update_docker_container script.',
    origin: '/server/docker_utils/update_docker_container.sh:12'
  },
  0
)

const validLogWithout = (field: keyof Log): Partial<Log> =>
  Object.fromEntries(Object.entries(validLog).filter(([key]) => key !== field))

describe('LogSchema', () => {
  it('Should accept a valid Log', () => {
    expect(LogSchema.safeParse(validLog).success).toBeTruthy()
  })

  it.each<keyof Log>(['groupName', 'origin'])(
    'Should accept a valid Log without the optional %s',
    (optionalField) => {
      expect(LogSchema.safeParse(validLogWithout(optionalField)).success).toBeTruthy()
    }
  )

  it.each<keyof Log>([
    'id',
    'contentId',
    'date',
    'location',
    'locationName',
    'jobId',
    'level',
    'message'
  ])('Should reject a Log missing the required %s', (requiredField) => {
    expect(LogSchema.safeParse(validLogWithout(requiredField)).success).toBeFalsy()
  })

  it('Should accept a Log with an origin in any form', () => {
    expect(LogSchema.safeParse({ ...validLog, origin: 'the nightly backup' }).success).toBeTruthy()
  })

  it('Should reject a Log with an empty origin', () => {
    expect(LogSchema.safeParse({ ...validLog, origin: '' }).success).toBeFalsy()
  })

  it('Should reject a Log with an invalid level', () => {
    expect(LogSchema.safeParse({ ...validLog, level: 'NOT_A_LEVEL' }).success).toBeFalsy()
  })

  it('Should reject a Log with a non-integer jobId', () => {
    expect(LogSchema.safeParse({ ...validLog, jobId: 1.5 }).success).toBeFalsy()
  })

  it('Should reject a Log with an unknown extra property', () => {
    expect(LogSchema.safeParse({ ...validLog, extra: 'not allowed' }).success).toBeFalsy()
  })
})

describe('LogArraySchema', () => {
  it('Should accept an array of valid Logs', () => {
    expect(LogArraySchema.safeParse([validLog, validLog]).success).toBeTruthy()
  })

  it('Should reject an array containing an invalid Log', () => {
    expect(
      LogArraySchema.safeParse([validLog, { ...validLog, jobId: 'not a number' }]).success
    ).toBeFalsy()
  })
})

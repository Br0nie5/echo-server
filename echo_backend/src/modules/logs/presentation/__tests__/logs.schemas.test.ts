import { createLogWithIds } from '@echo/utilities'
import type { ValidateFunction } from 'ajv'
import { Ajv } from 'ajv'
import addFormats from 'ajv-formats'
import { describe, it, expect, beforeAll } from 'vitest'

import { GetLogsParamsJsonSchema, LogJsonSchema, LogLevelJsonSchema } from '../logs.schemas.js'

/** The date of the logs validated against the schema. */
const LOG_DATE = '2026-01-01T00:00:00.000Z'

describe('LogLevelJsonSchema', () => {
  let validateLevel: ValidateFunction

  beforeAll(() => {
    const ajv = new Ajv()
    validateLevel = ajv.compile(LogLevelJsonSchema)
  })

  it('Should accept valid levels', () => {
    const validLevels = ['SUCCESS', 'INFO', 'WARNING', 'ERROR']
    validLevels.forEach((cat) => {
      expect(validateLevel(cat)).toBe(true)
    })
  })

  it('Should reject invalid levels', () => {
    expect(validateLevel('INVALID')).toBe(false)
    expect(validateLevel('success')).toBe(false) // case-sensitive
    expect(validateLevel('')).toBe(false)
  })
})

describe('LogJsonSchema', () => {
  let validateLog: ValidateFunction

  beforeAll(() => {
    const ajv = new Ajv()
    addFormats.default(ajv)
    ajv.addSchema(LogLevelJsonSchema)
    validateLog = ajv.compile(LogJsonSchema)
  })

  const validLog = createLogWithIds(
    {
      date: LOG_DATE,
      groupName: 'docker_utils',
      location: '/server/docker_utils/log/prune_images.jsonl',
      locationName: 'prune_images',
      jobId: 123,
      level: 'INFO',
      message: 'Something happened',
      origin: '/server/docker_utils/prune_images.sh:12'
    },
    0
  )

  it('Should accept a valid log object', () => {
    expect(validateLog(validLog)).toBe(true)
  })

  it('Should reject log object with missing required fields', () => {
    expect(validateLog({ ...validLog, message: undefined })).toBe(false)
    expect(validateLog.errors?.[0].message).toContain('required')
  })

  it('Should reject log object with invalid level', () => {
    expect(validateLog({ ...validLog, level: 'INVALID' })).toBe(false)
    expect(validateLog.errors?.[0].message).toContain('must be equal to one of the allowed values')
  })

  it('Should reject log object with additional properties', () => {
    expect(validateLog({ ...validLog, extra: 'not allowed' })).toBe(false)
    expect(validateLog.errors?.[0].message).toContain('must NOT have additional properties')
  })
})

describe('GetLogsParamsJsonSchema', () => {
  let validateQuery: ValidateFunction
  const fromDate = '2026-04-28T10:00:00.000Z'

  beforeAll(() => {
    const ajv = new Ajv()
    addFormats.default(ajv)
    ajv.addSchema(LogLevelJsonSchema)
    validateQuery = ajv.compile(GetLogsParamsJsonSchema)
  })

  it('Should accept a query with only fromDate', () => {
    expect(validateQuery({ fromDate })).toBe(true)
  })

  it('Should accept one log level or several ones', () => {
    expect(validateQuery({ fromDate, logLevels: 'INFO' })).toBe(true)
    expect(validateQuery({ fromDate, logLevels: ['INFO', 'ERROR'] })).toBe(true)
  })

  it('Should accept a logSearch and leave unknown properties alone', () => {
    expect(validateQuery({ fromDate, logSearch: 'message:boom', unknown: 'value' })).toBe(true)
  })

  it('Should reject a query without fromDate', () => {
    expect(validateQuery({})).toBe(false)
    expect(validateQuery.errors?.[0].message).toContain('required')
  })

  it('Should reject a fromDate that is not a date-time', () => {
    expect(validateQuery({ fromDate: 'invalid-date' })).toBe(false)
    expect(validateQuery.errors?.[0].message).toContain('must match format "date-time"')
  })

  it('Should reject an invalid log level', () => {
    expect(validateQuery({ fromDate, logLevels: 'INVALID' })).toBe(false)
    expect(validateQuery({ fromDate, logLevels: ['INFO', 'INVALID'] })).toBe(false)
  })
})

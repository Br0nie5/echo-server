import { createLogWithIds } from '@echo/utilities'
import type { ValidateFunction } from 'ajv'
import { Ajv } from 'ajv'
import addFormats from 'ajv-formats'
import { describe, it, expect, beforeAll } from 'vitest'

import { GetLogsParamsJsonSchema, LogJsonSchema, LogCategoryJsonSchema } from '../logs.schemas.js'

/** The date of the logs validated against the schema. */
const LOG_DATE = '2026-01-01T00:00:00.000Z'

describe('LogCategoryJsonSchema', () => {
  let validateCategory: ValidateFunction

  beforeAll(() => {
    const ajv = new Ajv()
    validateCategory = ajv.compile(LogCategoryJsonSchema)
  })

  it('Should accept valid categories', () => {
    const validCategories = ['SUCCESS', 'INFO', 'WARNING', 'ERROR']
    validCategories.forEach((cat) => {
      expect(validateCategory(cat)).toBe(true)
    })
  })

  it('Should reject invalid categories', () => {
    expect(validateCategory('INVALID')).toBe(false)
    expect(validateCategory('success')).toBe(false) // case-sensitive
    expect(validateCategory('')).toBe(false)
  })
})

describe('LogJsonSchema', () => {
  let validateLog: ValidateFunction

  beforeAll(() => {
    const ajv = new Ajv()
    addFormats.default(ajv)
    ajv.addSchema(LogCategoryJsonSchema)
    validateLog = ajv.compile(LogJsonSchema)
  })

  const validLog = createLogWithIds(
    {
      date: LOG_DATE,
      groupName: 'docker_utils',
      location: '/server/docker_utils/log/prune_images.jsonl',
      locationName: 'prune_images',
      jobId: 123,
      category: 'INFO',
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

  it('Should reject log object with invalid category', () => {
    expect(validateLog({ ...validLog, category: 'INVALID' })).toBe(false)
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
    ajv.addSchema(LogCategoryJsonSchema)
    validateQuery = ajv.compile(GetLogsParamsJsonSchema)
  })

  it('Should accept a query with only fromDate', () => {
    expect(validateQuery({ fromDate })).toBe(true)
  })

  it('Should accept one log category or several ones', () => {
    expect(validateQuery({ fromDate, logCategories: 'INFO' })).toBe(true)
    expect(validateQuery({ fromDate, logCategories: ['INFO', 'ERROR'] })).toBe(true)
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

  it('Should reject an invalid log category', () => {
    expect(validateQuery({ fromDate, logCategories: 'INVALID' })).toBe(false)
    expect(validateQuery({ fromDate, logCategories: ['INFO', 'INVALID'] })).toBe(false)
  })
})

import type { ValidateFunction } from 'ajv'
import { Ajv } from 'ajv'
import addFormats from 'ajv-formats'
import { describe, it, expect, beforeAll } from 'vitest'

import {
  GetLogsParamsQuerySchema,
  LogQuerySchema,
  LogCategoryQuerySchema
} from '../logs.schemas.js'

describe('LogCategoryQuerySchema', () => {
  let validateCategory: ValidateFunction

  beforeAll(() => {
    const ajv = new Ajv()
    validateCategory = ajv.compile(LogCategoryQuerySchema)
  })

  it('should accept valid categories', () => {
    const validCategories = ['SUCCESS', 'INFO', 'WARNING', 'ERROR']
    validCategories.forEach((cat) => {
      expect(validateCategory(cat)).toBe(true)
    })
  })

  it('should reject invalid categories', () => {
    expect(validateCategory('INVALID')).toBe(false)
    expect(validateCategory('success')).toBe(false) // case-sensitive
    expect(validateCategory('')).toBe(false)
  })
})

describe('LogQuerySchema', () => {
  let validateLog: ValidateFunction

  beforeAll(() => {
    const ajv = new Ajv()
    addFormats.default(ajv)
    ajv.addSchema(LogCategoryQuerySchema)
    validateLog = ajv.compile(LogQuerySchema)
  })

  it('should accept a valid log object', () => {
    const log = {
      id: '0 [myGroup] [file1] [123] Something happened',
      date: new Date().toISOString(),
      groupName: 'myGroup',
      fileName: 'file1',
      jobId: 123,
      category: 'INFO',
      message: 'Something happened',
      callFile: 'file1.sh',
      callLine: 4
    }
    expect(validateLog(log)).toBe(true)
  })

  it('should reject log object with missing required fields', () => {
    const log = {
      id: '1',
      date: new Date().toISOString(),
      fileName: 'file1',
      jobId: 1,
      category: 'INFO',
      callFile: 'file1.sh',
      callLine: 4
      // missing 'message'
    }
    expect(validateLog(log)).toBe(false)
    expect(validateLog.errors?.[0].message).toContain('required')
  })

  it('should reject log object with invalid category', () => {
    const log = {
      id: '1',
      date: new Date().toISOString(),
      groupName: 'grp',
      fileName: 'file1',
      jobId: 1,
      category: 'INVALID',
      message: 'oops',
      callFile: 'file1.sh',
      callLine: 4
    }
    expect(validateLog(log)).toBe(false)
    expect(validateLog.errors?.[0].message).toContain('must be equal to one of the allowed values')
  })

  it('should reject log object with additional properties', () => {
    const log = {
      id: '1',
      date: new Date().toISOString(),
      groupName: 'grp',
      fileName: 'file1',
      jobId: 1,
      category: 'INFO',
      message: 'test',
      callFile: 'file1.sh',
      callLine: 4,
      extra: 'not allowed'
    }
    expect(validateLog(log)).toBe(false)
    expect(validateLog.errors?.[0].message).toContain('must NOT have additional properties')
  })
})

describe('GetLogsParamsQuerySchema', () => {
  let validateQuery: ValidateFunction
  const fromDate = '2026-04-28T10:00:00.000Z'

  beforeAll(() => {
    const ajv = new Ajv()
    addFormats.default(ajv)
    ajv.addSchema(LogCategoryQuerySchema)
    validateQuery = ajv.compile(GetLogsParamsQuerySchema)
  })

  it('should accept a query with only fromDate', () => {
    expect(validateQuery({ fromDate })).toBe(true)
  })

  it('should accept one log category or several ones', () => {
    expect(validateQuery({ fromDate, logCategories: 'INFO' })).toBe(true)
    expect(validateQuery({ fromDate, logCategories: ['INFO', 'ERROR'] })).toBe(true)
  })

  it('should accept a logSearch and leave unknown properties alone', () => {
    expect(validateQuery({ fromDate, logSearch: 'message:boom', unknown: 'value' })).toBe(true)
  })

  it('should reject a query without fromDate', () => {
    expect(validateQuery({})).toBe(false)
    expect(validateQuery.errors?.[0].message).toContain('required')
  })

  it('should reject a fromDate that is not a date-time', () => {
    expect(validateQuery({ fromDate: 'invalid-date' })).toBe(false)
    expect(validateQuery.errors?.[0].message).toContain('must match format "date-time"')
  })

  it('should reject an invalid log category', () => {
    expect(validateQuery({ fromDate, logCategories: 'INVALID' })).toBe(false)
    expect(validateQuery({ fromDate, logCategories: ['INFO', 'INVALID'] })).toBe(false)
  })
})

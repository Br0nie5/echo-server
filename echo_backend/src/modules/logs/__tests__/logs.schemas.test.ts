import type { ValidateFunction } from 'ajv'
import { Ajv } from 'ajv'
import addFormats from 'ajv-formats'
import { describe, it, expect, beforeAll } from 'vitest'

import { LogCategorySchema, LogSchema } from '../logs.schemas.js'

describe('LogCategorySchema', () => {
  let validateCategory: ValidateFunction

  beforeAll(() => {
    const ajv = new Ajv()
    validateCategory = ajv.compile(LogCategorySchema)
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

describe('LogSchema', () => {
  let validateLog: ValidateFunction

  beforeAll(() => {
    const ajv = new Ajv()
    addFormats.default(ajv)
    ajv.addSchema(LogCategorySchema, 'LogCategory#')
    validateLog = ajv.compile(LogSchema)
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

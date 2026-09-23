import { describe, it, expect } from 'vitest'

import type { Log } from '../../types/__generated__/log.js'
import { LogCategory } from '../../types/__generated__/logCategory.js'
import { LogArraySchema, LogCategorySchema, LogSchema } from '../log.schema.js'

const validLog: Log = {
  id: '1',
  date: '2026-04-28T10:00:00.000Z',
  groupName: 'docker_utils',
  fileName: 'update_docker_container',
  jobId: 66,
  category: LogCategory.INFO,
  message: 'Finished update_docker_container script.',
  callFile: 'update_docker_container.sh',
  callLine: 12
}

describe('LogCategorySchema', () => {
  it('should accept every LogCategory value', () => {
    Object.values(LogCategory).forEach((category) => {
      expect(LogCategorySchema.safeParse(category).success).toBeTruthy()
    })
  })

  it('should reject a string that is not a LogCategory', () => {
    expect(LogCategorySchema.safeParse('NOT_A_CATEGORY').success).toBeFalsy()
  })
})

describe('LogSchema', () => {
  it('should accept a valid Log', () => {
    expect(LogSchema.safeParse(validLog).success).toBeTruthy()
  })

  it('should accept a valid Log without the optional groupName', () => {
    const logWithoutGroupName: Omit<Log, 'groupName'> = {
      id: validLog.id,
      date: validLog.date,
      fileName: validLog.fileName,
      jobId: validLog.jobId,
      category: validLog.category,
      message: validLog.message,
      callFile: validLog.callFile,
      callLine: validLog.callLine
    }

    expect(LogSchema.safeParse(logWithoutGroupName).success).toBeTruthy()
  })

  it('should reject a Log missing a required field', () => {
    const invalidLog: Omit<Log, 'message'> = {
      id: validLog.id,
      date: validLog.date,
      groupName: validLog.groupName,
      fileName: validLog.fileName,
      jobId: validLog.jobId,
      category: validLog.category,
      callFile: validLog.callFile,
      callLine: validLog.callLine
    }

    expect(LogSchema.safeParse(invalidLog).success).toBeFalsy()
  })

  it('should reject a Log with an invalid category', () => {
    expect(LogSchema.safeParse({ ...validLog, category: 'NOT_A_CATEGORY' }).success).toBeFalsy()
  })

  it('should reject a Log with a non-integer jobId', () => {
    expect(LogSchema.safeParse({ ...validLog, jobId: 1.5 }).success).toBeFalsy()
  })

  it('should reject a Log with an unknown extra property', () => {
    expect(LogSchema.safeParse({ ...validLog, extra: 'not allowed' }).success).toBeFalsy()
  })
})

describe('LogArraySchema', () => {
  it('should accept an array of valid Logs', () => {
    expect(LogArraySchema.safeParse([validLog, validLog]).success).toBeTruthy()
  })

  it('should reject an array containing an invalid Log', () => {
    expect(
      LogArraySchema.safeParse([validLog, { ...validLog, jobId: 'not a number' }]).success
    ).toBeFalsy()
  })
})

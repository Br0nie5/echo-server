import { describe, it, expect } from 'vitest'

import {
  convertLastCheckDateToRawLastCheckDate,
  convertRawLastCheckDateToLastCheckDate,
  LastCheckDateDtoSchema
} from '../lastCheckDate.dto.js'

describe('LastCheckDateDtoSchema', () => {
  it('Should accept a valid last-check payload', () => {
    expect(
      LastCheckDateDtoSchema.safeParse({ lastCheck: '2026-01-01T00:00:00.000Z' }).success
    ).toBeTruthy()
  })

  it('Should reject a payload missing lastCheck', () => {
    expect(LastCheckDateDtoSchema.safeParse({}).success).toBeFalsy()
  })

  it('Should reject a payload with a non-string lastCheck', () => {
    expect(LastCheckDateDtoSchema.safeParse({ lastCheck: 123 }).success).toBeFalsy()
  })
})

describe('convertRawLastCheckDateToLastCheckDate', () => {
  it('Should return the date when the content holds a valid one', () => {
    const lastCheckDate = convertRawLastCheckDateToLastCheckDate(
      JSON.stringify({ lastCheck: '2026-01-01T00:00:00.000Z' })
    )

    expect(lastCheckDate).toEqual({ lastCheckDate: new Date('2026-01-01T00:00:00.000Z') })
  })

  it('Should return undefined when the content is not JSON', () => {
    expect(convertRawLastCheckDateToLastCheckDate('not-json')).toBeUndefined()
  })

  it('Should return undefined when the content is missing the lastCheck field', () => {
    expect(convertRawLastCheckDateToLastCheckDate(JSON.stringify({}))).toBeUndefined()
  })

  it('Should return undefined when the lastCheck field is not a string', () => {
    expect(
      convertRawLastCheckDateToLastCheckDate(JSON.stringify({ lastCheck: 123 }))
    ).toBeUndefined()
  })

  it('Should return undefined when the lastCheck field is not a date', () => {
    expect(
      convertRawLastCheckDateToLastCheckDate(JSON.stringify({ lastCheck: 'not-a-date' }))
    ).toBeUndefined()
  })
})

describe('convertLastCheckDateToRawLastCheckDate', () => {
  it('Should give the JSON of the date under the lastCheck field', () => {
    const lastCheckDate = new Date('2026-01-01T00:00:00.000Z')

    expect(convertLastCheckDateToRawLastCheckDate({ lastCheckDate })).toBe(
      JSON.stringify({ lastCheck: '2026-01-01T00:00:00.000Z' }, null, 2)
    )
  })

  it('Should give a content that converts back to the same date', () => {
    const lastCheckDate = { lastCheckDate: new Date('2026-03-04T05:06:07.890Z') }

    expect(
      convertRawLastCheckDateToLastCheckDate(convertLastCheckDateToRawLastCheckDate(lastCheckDate))
    ).toEqual(lastCheckDate)
  })
})

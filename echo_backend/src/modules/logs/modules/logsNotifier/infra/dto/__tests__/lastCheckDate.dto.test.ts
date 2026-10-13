import { describe, it, expect } from 'vitest'

import { convertRawLastCheckDateToLastCheckDate } from '../lastCheckDate.dto.js'

describe('convertRawLastCheckDateToLastCheckDate', () => {
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

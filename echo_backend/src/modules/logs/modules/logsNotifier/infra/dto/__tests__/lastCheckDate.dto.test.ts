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

  it.each(['not-a-date', 'May 1, 2026 10:00'])(
    'Should return undefined when the lastCheck field is not an ISO date ("%s")',
    (lastCheck) => {
      expect(convertRawLastCheckDateToLastCheckDate(JSON.stringify({ lastCheck }))).toBeUndefined()
    }
  )
})

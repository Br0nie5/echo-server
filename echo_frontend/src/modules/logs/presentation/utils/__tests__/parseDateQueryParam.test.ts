import { describe, expect, it } from 'vitest'

import { parseDateQueryParam } from '../parseDateQueryParam'

describe('parseDateQueryParam', () => {
  it.each([
    { queryParam: '2026-04-26T00:00:00.000Z', date: new Date('2026-04-26T00:00:00.000Z') },
    { queryParam: '2026-04-26', date: new Date('2026-04-26T00:00:00.000Z') }
  ])('Should read the date of "$queryParam"', ({ queryParam, date }) => {
    expect(parseDateQueryParam(queryParam)).toStrictEqual(date)
  })

  it.each([null, '', 'not-a-date', '2026-13-45'])(
    'Should give undefined for %j, which is no date',
    (queryParam) => {
      expect(parseDateQueryParam(queryParam)).toBeUndefined()
    }
  )
})

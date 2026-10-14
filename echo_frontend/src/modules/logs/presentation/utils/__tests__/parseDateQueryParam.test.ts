import { parseDateQueryParam } from '../parseDateQueryParam'

const dateLimits = {
  minimalDate: new Date('2026-04-14T00:00:00.000Z'),
  maximalDate: new Date('2026-04-28T00:00:00.000Z')
}

describe('parseDateQueryParam', () => {
  it.each([
    { queryParam: '2026-04-26T00:00:00.000Z', date: new Date('2026-04-26T00:00:00.000Z') },
    { queryParam: '2026-04-26', date: new Date('2026-04-26T00:00:00.000Z') }
  ])('Should read the date of "$queryParam"', ({ queryParam, date }) => {
    expect(parseDateQueryParam(queryParam, dateLimits)).toStrictEqual(date)
  })

  it.each([null, '', 'not-a-date', '2026-13-45'])(
    'Should give undefined for %j, which is no date',
    (queryParam) => {
      expect(parseDateQueryParam(queryParam, dateLimits)).toBeUndefined()
    }
  )

  it.each([
    { queryParam: '2026-01-01T00:00:00.000Z', date: dateLimits.minimalDate },
    { queryParam: '2026-05-01T00:00:00.000Z', date: dateLimits.maximalDate }
  ])(
    'Should give the closest limit for "$queryParam", which is past it',
    ({ queryParam, date }) => {
      expect(parseDateQueryParam(queryParam, dateLimits)).toStrictEqual(date)
    }
  )
})

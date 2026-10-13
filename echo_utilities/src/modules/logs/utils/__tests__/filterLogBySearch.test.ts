import { describe, it, expect } from 'vitest'

import type { LogSearchableKey } from '../../consts/logSearchFilter.js'
import type { Log } from '../../schemas/log.schema.js'
import { LogLevel } from '../../schemas/logLevel.schema.js'
import { filterLogBySearch } from '../filterLogBySearch.js'

const log: Log = {
  id: 'log-id',
  date: '2026-04-25T22:00:00.000Z',
  groupName: 'billing',
  location: '/storage/first',
  locationName: 'send_invoices',
  jobId: 123,
  level: LogLevel.INFO,
  message: 'Quota almost reached',
  origin: 'export.sh:7'
}

const searchOfEachKey: Array<{ key: LogSearchableKey; search: string }> = [
  { key: 'locationName', search: 'send_invoices' },
  { key: 'groupName', search: 'billing' },
  { key: 'jobId', search: '123' },
  { key: 'message', search: 'Quota almost reached' }
]

describe('filterLogBySearch', () => {
  it.each(searchOfEachKey)(
    'Should keep a log whose $key holds what a find filter looks for in it',
    ({ key, search }) => {
      expect(filterLogBySearch(log, [{ key, mode: 'find', search }])).toBe(true)
    }
  )

  it.each(searchOfEachKey)(
    'Should leave out a log whose $key holds what a remove filter looks for in it',
    ({ key, search }) => {
      expect(filterLogBySearch(log, [{ key, mode: 'remove', search }])).toBe(false)
    }
  )

  it.each<{ key: LogSearchableKey; search: string }>([
    { key: 'locationName', search: 'billing' },
    { key: 'groupName', search: '123' },
    { key: 'jobId', search: 'Quota' },
    { key: 'message', search: 'send_invoices' }
  ])('Should look for "$search" in $key only, when the filter has that key', ({ key, search }) => {
    expect(filterLogBySearch(log, [{ key, mode: 'find', search }])).toBe(false)
    expect(filterLogBySearch(log, [{ key, mode: 'remove', search }])).toBe(true)
  })

  it.each(searchOfEachKey)(
    'Should look for "$search" in every searchable field, $key included, when the filter has no key',
    ({ search }) => {
      expect(filterLogBySearch(log, [{ mode: 'find', search }])).toBe(true)
      expect(filterLogBySearch(log, [{ mode: 'remove', search }])).toBe(false)
    }
  )

  it.each<{ key: LogSearchableKey; search: string }>([
    { key: 'locationName', search: 'invoice' },
    { key: 'groupName', search: 'bill' },
    { key: 'jobId', search: '12' },
    { key: 'message', search: 'almost' }
  ])('Should find "$search", a part of the $key', ({ key, search }) => {
    expect(filterLogBySearch(log, [{ key, mode: 'find', search }])).toBe(true)
  })

  it.each<{ key: LogSearchableKey; search: string }>([
    { key: 'locationName', search: 'Send_Invoices' },
    { key: 'groupName', search: 'BILLING' },
    { key: 'message', search: 'quota ALMOST reached' }
  ])('Should find "$search" in the $key whatever its case', ({ key, search }) => {
    expect(filterLogBySearch(log, [{ key, mode: 'find', search }])).toBe(true)
  })

  it.each([
    { field: 'id', search: 'log-id' },
    { field: 'date', search: '2026-04-25' },
    { field: 'location', search: '/storage/first' },
    { field: 'level', search: 'INFO' },
    { field: 'origin', search: 'export.sh' }
  ])('Should not look in the $field, which is not searchable', ({ search }) => {
    expect(filterLogBySearch(log, [{ mode: 'find', search }])).toBe(false)
  })

  it('Should find nothing in the group name of a log that has none', () => {
    const logWithoutGroup: Log = { ...log, groupName: undefined }

    expect(
      filterLogBySearch(logWithoutGroup, [{ key: 'groupName', mode: 'find', search: 'undefined' }])
    ).toBe(false)
    expect(
      filterLogBySearch(logWithoutGroup, [
        { key: 'groupName', mode: 'remove', search: 'undefined' }
      ])
    ).toBe(true)
  })

  it('Should keep a log that satisfies every filter', () => {
    expect(
      filterLogBySearch(log, [
        { key: 'message', mode: 'find', search: 'quota' },
        { mode: 'find', search: 'send_invoices' },
        { mode: 'remove', search: 'refund' }
      ])
    ).toBe(true)
  })

  it.each([
    { reason: 'a find filter finds nothing', mode: 'find' as const, search: 'refund' },
    { reason: 'a remove filter finds something', mode: 'remove' as const, search: 'send_invoices' }
  ])('Should leave out a log when $reason, whatever the other filters', ({ mode, search }) => {
    expect(
      filterLogBySearch(log, [
        { key: 'message', mode: 'find', search: 'quota' },
        { mode, search }
      ])
    ).toBe(false)
  })

  it('Should keep a log when there is no filter', () => {
    expect(filterLogBySearch(log, [])).toBe(true)
  })
})

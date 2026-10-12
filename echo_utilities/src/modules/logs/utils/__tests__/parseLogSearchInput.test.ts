import { describe, it, expect } from 'vitest'

import { logSearchableKeys, type LogSearchFilter } from '../../consts/logSearchFilter.js'
import { parseLogSearchInput } from '../parseLogSearchInput.js'

interface ParsedInput {
  input: string
  searchFilters: LogSearchFilter[]
}

describe('parseLogSearchInput', () => {
  it.each<ParsedInput>([
    {
      input: 'foo bar',
      searchFilters: [
        { mode: 'find', search: 'foo' },
        { mode: 'find', search: 'bar' }
      ]
    },
    {
      input: '  foo   bar ',
      searchFilters: [
        { mode: 'find', search: 'foo' },
        { mode: 'find', search: 'bar' }
      ]
    },
    { input: 'foo\\ bar', searchFilters: [{ mode: 'find', search: 'foo bar' }] },
    { input: '"foo bar"', searchFilters: [{ mode: 'find', search: 'foo bar' }] },
    { input: '"foo bar', searchFilters: [{ mode: 'find', search: 'foo bar' }] },
    {
      input: 'My\\ "custom"\\ search',
      searchFilters: [{ mode: 'find', search: 'My custom search' }]
    },
    { input: 'foo\\bar', searchFilters: [{ mode: 'find', search: 'foo\\bar' }] }
  ])(
    'Should split the input `$input` on the spaces that are neither escaped nor quoted',
    ({ input, searchFilters }) => {
      expect(parseLogSearchInput(input)).toEqual(searchFilters)
    }
  )

  it.each<ParsedInput>([
    { input: 'foo', searchFilters: [{ mode: 'find', search: 'foo' }] },
    { input: '-foo', searchFilters: [{ mode: 'remove', search: 'foo' }] },
    { input: '-"foo bar"', searchFilters: [{ mode: 'remove', search: 'foo bar' }] },
    { input: '--foo', searchFilters: [{ mode: 'remove', search: '-foo' }] },
    { input: 'foo-bar', searchFilters: [{ mode: 'find', search: 'foo-bar' }] }
  ])(
    'Should read `$input` as a remove filter only when it starts with a dash',
    ({ input, searchFilters }) => {
      expect(parseLogSearchInput(input)).toEqual(searchFilters)
    }
  )

  it.each(logSearchableKeys)('Should limit a filter to the %s field named before it', (key) => {
    expect(parseLogSearchInput(`${key}:error -${key}:warning`)).toEqual([
      { key, mode: 'find', search: 'error' },
      { key, mode: 'remove', search: 'warning' }
    ])
  })

  it.each<ParsedInput>([
    {
      input: 'message:"quota reached"',
      searchFilters: [{ key: 'message', mode: 'find', search: 'quota reached' }]
    },
    {
      input: 'message:code:42',
      searchFilters: [{ key: 'message', mode: 'find', search: 'code:42' }]
    }
  ])('Should search for everything after the key in `$input`', ({ input, searchFilters }) => {
    expect(parseLogSearchInput(input)).toEqual(searchFilters)
  })

  it.each(['origin:send_invoices', 'Message:error', 'unknown:value'])(
    'Should search for the whole `%s`, which starts with no searchable key',
    (input) => {
      expect(parseLogSearchInput(input)).toEqual([{ mode: 'find', search: input }])
    }
  )

  it.each(['', '   ', '""', '-', 'message:', '-message:'])(
    'Should give no filter for `%s`, which has nothing to search for',
    (input) => {
      expect(parseLogSearchInput(input)).toEqual([])
    }
  )

  it('Should give the filters in the order of the input', () => {
    expect(parseLogSearchInput('locationName:send_invoices -unknown:auth - "my message"')).toEqual([
      { key: 'locationName', mode: 'find', search: 'send_invoices' },
      { mode: 'remove', search: 'unknown:auth' },
      { mode: 'find', search: 'my message' }
    ])
  })
})

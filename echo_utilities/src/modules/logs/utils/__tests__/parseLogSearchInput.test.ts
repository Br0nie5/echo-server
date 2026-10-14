import { describe, it, expect } from 'vitest'

import { logSearchableKeys } from '../../consts/logSearchableKeys.js'
import type { LogSearchFilter } from '../../types/logSearchFilter.js'
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
    { input: '"foo\\ bar"', searchFilters: [{ mode: 'find', search: 'foo bar' }] },
    { input: 'foo\\bar', searchFilters: [{ mode: 'find', search: 'foo\\bar' }] },
    { input: 'foo\\', searchFilters: [{ mode: 'find', search: 'foo\\' }] }
  ])(
    'Should split the input `$input` on the spaces that are neither escaped nor quoted',
    ({ input, searchFilters }) => {
      expect(parseLogSearchInput(input)).toEqual(searchFilters)
    }
  )

  it.each<ParsedInput>([
    { input: 'foo\tbar', searchFilters: [{ mode: 'find', search: 'foo\tbar' }] },
    { input: 'foo\nbar', searchFilters: [{ mode: 'find', search: 'foo\nbar' }] },
    { input: 'foo\u00a0bar', searchFilters: [{ mode: 'find', search: 'foo\u00a0bar' }] }
  ])(
    'Should not split the input %j, which holds no space character',
    ({ input, searchFilters }) => {
      expect(parseLogSearchInput(input)).toEqual(searchFilters)
    }
  )

  it.each<ParsedInput>([
    { input: 'say\\"hi', searchFilters: [{ mode: 'find', search: 'say"hi' }] },
    { input: '"say \\"hi\\""', searchFilters: [{ mode: 'find', search: 'say "hi"' }] },
    {
      input: '\\"foo bar',
      searchFilters: [
        { mode: 'find', search: '"foo' },
        { mode: 'find', search: 'bar' }
      ]
    }
  ])('Should search for the escaped double quotes of `$input`', ({ input, searchFilters }) => {
    expect(parseLogSearchInput(input)).toEqual(searchFilters)
  })

  it.each<ParsedInput>([
    {
      input: 'foo\\\\ bar',
      searchFilters: [
        { mode: 'find', search: 'foo\\' },
        { mode: 'find', search: 'bar' }
      ]
    },
    { input: '"C:\\\\temp\\\\"', searchFilters: [{ mode: 'find', search: 'C:\\temp\\' }] },
    { input: 'say\\\\\\"hi', searchFilters: [{ mode: 'find', search: 'say\\"hi' }] }
  ])('Should search for the escaped backslashes of `$input`', ({ input, searchFilters }) => {
    expect(parseLogSearchInput(input)).toEqual(searchFilters)
  })

  it.each<ParsedInput>([
    { input: '"-foo"', searchFilters: [{ mode: 'find', search: '-foo' }] },
    { input: '-"-foo"', searchFilters: [{ mode: 'remove', search: '-foo' }] },
    { input: '"message:foo"', searchFilters: [{ mode: 'find', search: 'message:foo' }] },
    { input: '"message":foo', searchFilters: [{ mode: 'find', search: 'message:foo' }] },
    { input: 'message":"foo', searchFilters: [{ mode: 'find', search: 'message:foo' }] },
    {
      input: 'message:"-jobId:12"',
      searchFilters: [{ key: 'message', mode: 'find', search: '-jobId:12' }]
    }
  ])(
    'Should search for the quoted dash or key of `$input`, which is not read as syntax',
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
    { input: 'Message:error', searchFilters: [{ key: 'message', mode: 'find', search: 'error' }] },
    {
      input: '-LOCATIONNAME:send_invoices',
      searchFilters: [{ key: 'locationName', mode: 'remove', search: 'send_invoices' }]
    },
    {
      input: 'groupname:billing',
      searchFilters: [{ key: 'groupName', mode: 'find', search: 'billing' }]
    }
  ])('Should read the key of `$input` whatever its case', ({ input, searchFilters }) => {
    expect(parseLogSearchInput(input)).toEqual(searchFilters)
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

  it.each(['origin:send_invoices', 'messages:error', 'unknown:value'])(
    'Should search for the whole `%s`, which starts with no searchable key',
    (input) => {
      expect(parseLogSearchInput(input)).toEqual([{ mode: 'find', search: input }])
    }
  )

  it.each(['', '   ', '""', '-', '-""', 'message:', 'message:""', '-message:'])(
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

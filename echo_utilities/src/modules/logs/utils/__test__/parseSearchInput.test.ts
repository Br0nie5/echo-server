import { describe, it, expect } from 'vitest'

import type { LogSearchableKeys, LogSearchFilter } from '../../types/logSearchFilter'
import { parseLogSearchInput } from '../parseLogSearchInput'

const VALID_SEARCH_KEY: LogSearchableKeys = 'fileName'

describe('parseLogSearchInput', () => {
  describe('splitLogSearchInput', () => {
    it('Should splits search input on bare spaces', () => {
      const searchFilters: LogSearchFilter[] = [
        { mode: 'find', search: 'foo' },
        { mode: 'find', search: 'bar' }
      ]

      expect(parseLogSearchInput('foo bar')).toEqual(searchFilters)
    })

    it('Should not split search input on escaped spaces', () => {
      const searchFilters: LogSearchFilter[] = [{ mode: 'find', search: 'foo bar' }]

      expect(parseLogSearchInput('foo\\ bar')).toEqual(searchFilters)
    })

    it('Should not split search input on spaces inside quotes', () => {
      const searchFilters: LogSearchFilter[] = [{ mode: 'find', search: 'foo bar' }]

      expect(parseLogSearchInput('"foo bar"')).toEqual(searchFilters)
    })

    it('Should handle a mixed escaped spaces and quotes in one search input', () => {
      const searchFilters: LogSearchFilter[] = [{ mode: 'find', search: 'My custom search' }]

      expect(parseLogSearchInput('My\\ "custom"\\ search')).toEqual(searchFilters)
    })

    it('Should ignore consecutive spaces', () => {
      const searchFilters: LogSearchFilter[] = [
        { mode: 'find', search: 'foo' },
        { mode: 'find', search: 'bar' }
      ]

      expect(parseLogSearchInput('foo  bar')).toEqual(searchFilters)
    })

    it('Should return an empty array for empty string', () => {
      expect(parseLogSearchInput('')).toEqual([])
    })
  })

  describe('mode', () => {
    it('Should use find as a default mode', () => {
      expect(parseLogSearchInput('foo')[0].mode).toBe('find')
    })

    it('Should set remove mode when search input part is prefixed with -', () => {
      const searchFilter: LogSearchFilter = { mode: 'remove', search: 'foo' }

      expect(parseLogSearchInput('-foo')[0]).toEqual(searchFilter)
    })

    it('Should not add the search input part when the rest of the string after the - is empty', () => {
      expect(parseLogSearchInput('-')).toEqual([])
    })
  })

  describe('key detection', () => {
    it('Should set key to all when no known key prefix was found', () => {
      expect(parseLogSearchInput('unknown:value')[0].key).toBeUndefined()
    })

    it('Should set key to the detected prefix when a valid key prefix is found', () => {
      const searchFilter: LogSearchFilter = { key: VALID_SEARCH_KEY, mode: 'find', search: 'error' }

      expect(parseLogSearchInput(`${VALID_SEARCH_KEY}:error`)[0]).toEqual(searchFilter)
    })

    it('Should still detect the prefix if the search input part starts with a - for the remove mode', () => {
      const searchFilter: LogSearchFilter = {
        key: VALID_SEARCH_KEY,
        mode: 'remove',
        search: 'error'
      }

      expect(parseLogSearchInput(`-${VALID_SEARCH_KEY}:error`)[0]).toEqual(searchFilter)
    })

    it('Should not add the search input part when the rest of the string after the key is empty', () => {
      expect(parseLogSearchInput(`${VALID_SEARCH_KEY}:`)).toEqual([])
    })
  })

  describe('combined', () => {
    it('parses a complex multi-token query', () => {
      const searchFilters: LogSearchFilter[] = [
        { key: VALID_SEARCH_KEY, mode: 'find', search: 'error' },
        { mode: 'remove', search: 'notAKey:auth' },
        { mode: 'find', search: 'my message' }
      ]

      expect(parseLogSearchInput(`${VALID_SEARCH_KEY}:error -notAKey:auth "my message"`)).toEqual(
        searchFilters
      )
    })
  })
})

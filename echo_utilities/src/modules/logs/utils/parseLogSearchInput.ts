import { logSearchableKeys } from '../consts/logSearchableKeys.js'
import type { LogSearchFilter } from '../types/logSearchFilter.js'

/** The text a term looks for, with where the next term starts in the search input. */
interface ReadSearch {
  search: string
  nextTermIndex: number
}

/**
 * Reads the text a term looks for, from `startIndex` of `searchInput` to the space ending the term.
 *
 * A double quote is dropped, and the spaces up to the next one belong to the text: an unclosed quote
 * runs to the end of the input. A backslash before a space or a double quote is dropped too, and
 * that character belongs to the text. A backslash before anything else is kept as it is.
 *
 * ```ts
 * readSearch('"disk full" timeout', 0) // { search: 'disk full', nextTermIndex: 12 }
 * ```
 */
const readSearch = (searchInput: string, startIndex: number): ReadSearch => {
  let search = ''
  let isQuoted = false
  let inputIndex = startIndex

  while (inputIndex < searchInput.length) {
    const character = searchInput[inputIndex]
    const nextCharacter = searchInput[inputIndex + 1]

    if (character === '\\' && (nextCharacter === ' ' || nextCharacter === '"')) {
      search += nextCharacter
      inputIndex += 2
    } else if (character === '"') {
      isQuoted = !isQuoted
      inputIndex++
    } else if (character === ' ' && !isQuoted) {
      return { search, nextTermIndex: inputIndex + 1 }
    } else {
      search += character
      inputIndex++
    }
  }

  return { search, nextTermIndex: inputIndex }
}

/**
 * Turns what the user typed in the search field into the filters `filterLogBySearch` applies.
 *
 * The input is made of terms separated by spaces, the space character only, and a term reads
 * `[-][key:]search`: a leading `-` makes it a `remove` filter, a `find` one otherwise, and one of
 * the `logSearchableKeys` followed by `:` limits it to that field. Any other `word:` is part of the
 * search. A term left with nothing to search for (`-`, `message:`) is dropped.
 *
 * In the search, double quotes hold several words together, and a backslash makes the space or the
 * double quote after it part of the text. The dash and the key are only read as they are typed: a
 * quoted or escaped one is part of the search, so `"-12"` looks for `-12`.
 *
 * ```ts
 * const [findFilter, removeFilter] = parseLogSearchInput('message:error -"sent twice"')
 * findFilter // { key: 'message', mode: 'find', search: 'error' }
 * removeFilter // { mode: 'remove', search: 'sent twice' }
 * ```
 */
export const parseLogSearchInput = (logSearchInput: string): LogSearchFilter[] => {
  const searchFilters: LogSearchFilter[] = []
  let inputIndex = 0

  while (inputIndex < logSearchInput.length) {
    const isRemove = logSearchInput.startsWith('-', inputIndex)
    const keyIndex = isRemove ? inputIndex + 1 : inputIndex
    const key = logSearchableKeys.find((searchableKey) =>
      logSearchInput.startsWith(`${searchableKey}:`, keyIndex)
    )
    const searchIndex = key === undefined ? keyIndex : keyIndex + `${key}:`.length
    const { search, nextTermIndex } = readSearch(logSearchInput, searchIndex)

    if (search.length > 0) {
      searchFilters.push({ ...(key && { key }), mode: isRemove ? 'remove' : 'find', search })
    }

    inputIndex = nextTermIndex
  }

  return searchFilters
}

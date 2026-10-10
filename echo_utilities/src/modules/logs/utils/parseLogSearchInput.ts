import { logSearchableKeys, type LogSearchFilter } from '../consts/logSearchFilter.js'

/**
 * Splits a search input into its parts, on the spaces between them.
 *
 * A space preceded by a backslash (`\ `) belongs to the part, the backslash dropped, and so does
 * everything between double quotes, the quotes dropped: an unclosed quote runs to the end of the
 * input. A backslash before any other character is kept as it is. Consecutive spaces split once.
 *
 * ```ts
 * splitLogSearchInput('foo\\ bar "my message" baz') // ['foo bar', 'my message', 'baz']
 * ```
 */
const splitLogSearchInput = (searchInput: string): string[] => {
  const searchInputParts: string[] = []
  let currentPart = ''
  let inputIndex = 0

  while (inputIndex < searchInput.length) {
    const character = searchInput[inputIndex]

    if (character === '\\' && searchInput[inputIndex + 1] === ' ') {
      currentPart += ' '
      inputIndex += 2
    } else if (character === '"') {
      inputIndex++
      while (inputIndex < searchInput.length && searchInput[inputIndex] !== '"') {
        currentPart += searchInput[inputIndex]
        inputIndex++
      }
      inputIndex++
    } else if (character === ' ') {
      if (currentPart.length > 0) {
        searchInputParts.push(currentPart)
        currentPart = ''
      }
      inputIndex++
    } else {
      currentPart += character
      inputIndex++
    }
  }

  if (currentPart.length > 0) {
    searchInputParts.push(currentPart)
  }

  return searchInputParts
}

/**
 * Turns what the user typed in the search field into the filters `filterLogBySearch` applies.
 *
 * The input is split on spaces (see `splitLogSearchInput` for the escaped spaces and the quotes),
 * and each part reads `[-][key:]search`: a leading `-` makes it a `remove` filter, a `find` one
 * otherwise, and one of the `logSearchableKeys` followed by `:` limits it to that field. Any other
 * `word:` is part of the search. A part left with nothing to search for (`-`, `message:`) is
 * dropped.
 *
 * ```ts
 * parseLogSearchInput('message:error -"docker utils"')
 * // [{ key: 'message', mode: 'find', search: 'error' }, { mode: 'remove', search: 'docker utils' }]
 * ```
 */
export const parseLogSearchInput = (logSearchInput: string): LogSearchFilter[] => {
  const logSearchInputParts = splitLogSearchInput(logSearchInput)

  return logSearchInputParts
    .map((logSearchInputPart): LogSearchFilter | undefined => {
      const isRemove = logSearchInputPart.startsWith('-')
      const mode = isRemove ? 'remove' : 'find'
      const logSearchInputPartWithoutMode = isRemove
        ? logSearchInputPart.slice(1)
        : logSearchInputPart

      if (logSearchInputPartWithoutMode.length === 0) {
        return undefined
      }

      const matchedKey = logSearchableKeys.find((key) =>
        logSearchInputPartWithoutMode.startsWith(`${key}:`)
      )

      if (matchedKey !== undefined) {
        const logSearchInputPartWithoutModeAndKey = logSearchInputPartWithoutMode.slice(
          `${matchedKey}:`.length
        )

        if (logSearchInputPartWithoutModeAndKey.length === 0) {
          return undefined
        }

        return {
          key: matchedKey,
          mode,
          search: logSearchInputPartWithoutModeAndKey
        }
      }

      return { mode, search: logSearchInputPartWithoutMode }
    })
    .filter((searchInputPart) => searchInputPart !== undefined)
}

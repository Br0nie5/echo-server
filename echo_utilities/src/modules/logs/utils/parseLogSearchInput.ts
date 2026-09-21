import { logSearchSuggestions, type LogSearchFilter } from '../types/logSearchFilter.js'

/**
 * Split a search input string into raw parts.
 * Rules:
 *  - Bare spaces split tokens
 *  - `\ ` (backslash-space) is a literal space within a token
 *  - Quoted regions `"..."` are included as-is (quotes stripped), spaces inside don't split
 *  - A backslash before any other char is kept as-is (no special treatment)
 */
const splitLogSearchInput = (searchInput: string): string[] => {
  const searchInputParts: string[] = []
  let currentPart = ''
  let inputIndex = 0

  while (inputIndex < searchInput.length) {
    const character = searchInput[inputIndex]

    if (character === '\\' && searchInput[inputIndex + 1] === ' ') {
      // Escaped space → literal space, not a split
      currentPart += ' '
      inputIndex += 2
    } else if (character === '"') {
      // Consume until closing quote (no nesting)
      inputIndex++
      while (inputIndex < searchInput.length && searchInput[inputIndex] !== '"') {
        currentPart += searchInput[inputIndex]
        inputIndex++
      }
      inputIndex++ // skip closing quote
    } else if (character === ' ') {
      // Bare space → split
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
 * Turns a search input into filters. Each part is `[-][key:]search`:
 * a `-` prefix makes it a `remove` filter and a known `key:` limits it to that field.
 * Parts with nothing to search for (`-`, `message:`) are dropped.
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

      if (logSearchInputPartWithoutMode.length == 0) {
        return undefined
      }

      const matchedKey = logSearchSuggestions.find((key) =>
        logSearchInputPartWithoutMode.startsWith(`${key}:`)
      )

      if (matchedKey !== undefined) {
        const logSearchInputPartWithoutModeAndKey = logSearchInputPartWithoutMode.slice(
          matchedKey.length + 1
        ) // +1 for ":"

        if (logSearchInputPartWithoutModeAndKey.length == 0) {
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
    .filter((searchInputPart) => searchInputPart != undefined)
}

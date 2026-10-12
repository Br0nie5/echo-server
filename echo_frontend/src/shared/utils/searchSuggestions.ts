/**
 * Gives the suggestions to offer for the last word of `inputValue`, the text of a search input.
 *
 * None before the last word holds a `:`. After it, those of `suggestions` starting with what
 * follows the `:`, whatever the case.
 *
 * ```ts
 * getSearchSuggestions('error :co', ['color', 'count', 'size']) // ['color', 'count']
 * ```
 */
export const getSearchSuggestions = (inputValue: string, suggestions: string[]): string[] => {
  const lastWord = inputValue.split(' ').pop() || ''

  if (!lastWord.includes(':')) {
    return []
  }

  const suggestionWord = lastWord.split(':')[1] || ''

  return suggestions.filter((option) =>
    option.toLowerCase().startsWith(suggestionWord.toLowerCase())
  )
}

/**
 * Replaces the last word of `inputValue`, the text of a search input, with `suggestion` followed
 * by `:`, keeping the `-` the word starts with.
 *
 * ```ts
 * applySearchSuggestion('error -:co', 'color') // 'error -color:'
 * ```
 */
export const applySearchSuggestion = (inputValue: string, suggestion: string): string => {
  const words = inputValue.split(' ')
  const lastWord = words.pop()
  const wordPrefix = lastWord?.at(0) === '-' ? '-' : ''

  return [...words, `${wordPrefix}${suggestion}:`].join(' ')
}

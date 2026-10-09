/** Suggestions matching the `key:` the user is typing in the last word of the search input. */
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

/** Replaces the last word of the search input by the chosen suggestion, keeping its `-` prefix. */
export const applySearchSuggestion = (inputValue: string, suggestion: string): string => {
  const words = inputValue.split(' ')
  const lastWord = words.pop()
  const wordPrefix = lastWord?.at(0) === '-' ? '-' : ''

  return [...words, `${wordPrefix}${suggestion}:`].join(' ')
}

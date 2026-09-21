import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'

import { useWindowSize } from '../../../../shared/hooks/useWindowSize'
import { useAppTranslation, type AppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { applySearchSuggestion, getSearchSuggestions } from '../utils/searchSuggestions'

/** No suggestion highlighted. */
const SUGGESTION_DEFAULT_INDEX = -1

interface UseSearchBarParams {
  suggestions?: string[]
  initialInputValue?: string
  onSearch: (search: string) => void
}

interface UseSearchBarReturnType {
  translation: AppTranslation
  isSmallScreen: boolean
  anchorElement: HTMLDivElement | null
  setAnchorElement: (node: HTMLDivElement | null) => void
  handleSubmit: (event: React.FormEvent) => void
  updateShowSuggestions: (filteredSuggestionsLength: number) => void
  inputValue: string
  setInputValue: Dispatch<SetStateAction<string>>
  handleKeyDown: (event: React.KeyboardEvent) => void
  showSuggestions: boolean
  filteredSuggestions: string[]
  setShowSuggestions: Dispatch<SetStateAction<boolean>>
  suggestionIndex: number
  applySuggestion: (option: string) => void
}

/** State and keyboard handling of the search bar: the input, the suggestions list (arrows to move, Enter to apply, Escape to close), and submit. */
export const useSearchBar = ({
  suggestions,
  initialInputValue,
  onSearch
}: UseSearchBarParams): UseSearchBarReturnType => {
  const translation = useAppTranslation()

  const [inputValue, setInputValue] = useState(initialInputValue ?? '')

  const [showSuggestions, setShowSuggestions] = useState(false)
  const updateShowSuggestions = (filteredSuggestionsLength: number): void =>
    setShowSuggestions(filteredSuggestionsLength > 0)

  const [suggestionIndex, setSuggestionIndex] = useState(SUGGESTION_DEFAULT_INDEX)

  const { isSmallScreen } = useWindowSize()

  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null)

  const filteredSuggestions = useMemo(() => {
    return suggestions ? getSearchSuggestions(inputValue, suggestions) : []
  }, [inputValue, suggestions])

  const [previousFilteredSuggestions, setPreviousFilteredSuggestions] =
    useState(filteredSuggestions)

  if (filteredSuggestions !== previousFilteredSuggestions) {
    setPreviousFilteredSuggestions(filteredSuggestions)
    setSuggestionIndex(SUGGESTION_DEFAULT_INDEX)
    updateShowSuggestions(filteredSuggestions.length)
  }

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault()
    setShowSuggestions(false)

    onSearch(inputValue)
  }

  const applySuggestion = (option: string): void => {
    setInputValue(applySearchSuggestion(inputValue, option))
    setShowSuggestions(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (!showSuggestions) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSuggestionIndex((previousActiveIndex) =>
        previousActiveIndex < filteredSuggestions.length - 1
          ? previousActiveIndex + 1
          : SUGGESTION_DEFAULT_INDEX
      )
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSuggestionIndex((previousActiveIndex) =>
        previousActiveIndex > SUGGESTION_DEFAULT_INDEX
          ? previousActiveIndex - 1
          : filteredSuggestions.length - 1
      )
    }

    if (event.key === 'Enter') {
      if (suggestionIndex > -1) {
        event.preventDefault()
        applySuggestion(filteredSuggestions[suggestionIndex])
      }
    }

    if (event.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return {
    translation,
    isSmallScreen,
    anchorElement,
    setAnchorElement,
    handleSubmit,
    updateShowSuggestions,
    inputValue,
    setInputValue,
    handleKeyDown,
    showSuggestions,
    filteredSuggestions,
    setShowSuggestions,
    suggestionIndex,
    applySuggestion
  }
}

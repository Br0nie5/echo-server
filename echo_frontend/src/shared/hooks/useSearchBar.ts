import { useMemo, useState } from 'react'

import type { ControlledState } from '../types/controlledState'
import { applySearchSuggestion, getSearchSuggestions } from '../utils/searchSuggestions'

import { useSyncedState } from './useSyncedState'

/** No suggestion highlighted. */
const NO_HIGHLIGHTED_SUGGESTION_INDEX = -1

interface UseSearchBarParams {
  /** The keys to suggest, as `SearchBar` takes them. */
  suggestions?: readonly string[]
  /** The submitted search, held by the parent. */
  controlledState?: ControlledState<string>
}

interface UseSearchBarReturnType {
  /** The text being typed. */
  inputValue: string
  /** Replaces the text being typed. */
  setInputValue: (inputValue: string) => void
  /** Gives the text being typed to `controlledState`, and closes the suggestions. */
  submit: (event: React.FormEvent) => void
  /**
   * Moves through the suggestions with the arrows, applies one with Enter, closes them with
   * Escape.
   */
  handleKeyDown: (event: React.KeyboardEvent) => void
  /** The suggestions matching the last word of the text being typed. */
  matchingSuggestions: string[]
  /** Whether the suggestions are displayed. */
  areSuggestionsOpen: boolean
  /** The position of the highlighted suggestion, -1 when none is. */
  highlightedSuggestionIndex: number
  /** Displays the suggestions, when some match. */
  openSuggestions: () => void
  /** Hides the suggestions. */
  closeSuggestions: () => void
  /**
   * Replaces the last word of the text being typed with `suggestion`, and closes the
   * suggestions.
   */
  applySuggestion: (suggestion: string) => void
}

/**
 * Gives the state and the keyboard handling of the search bar: the text being typed, its
 * suggestions and the submit.
 *
 * The suggestions open each time the ones matching the text change, as long as there are some, and
 * none is highlighted then. `controlledState` is the submitted search: submitting gives it the text
 * being typed, and that text takes its value back whenever it changes.
 *
 * ```ts
 * const { inputValue, setInputValue, submit, handleKeyDown } = useSearchBar({ controlledState })
 * ```
 */
export const useSearchBar = ({
  suggestions,
  controlledState
}: UseSearchBarParams): UseSearchBarReturnType => {
  const [inputValue, setInputValue] = useSyncedState(controlledState?.value ?? '')

  const matchingSuggestions = useMemo(
    () => (suggestions ? getSearchSuggestions(inputValue, suggestions) : []),
    [inputValue, suggestions]
  )

  const [areSuggestionsOpen, setAreSuggestionsOpen] = useState(false)
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(
    NO_HIGHLIGHTED_SUGGESTION_INDEX
  )

  const openSuggestions = (): void => setAreSuggestionsOpen(matchingSuggestions.length > 0)
  const closeSuggestions = (): void => setAreSuggestionsOpen(false)

  const [previousMatchingSuggestions, setPreviousMatchingSuggestions] =
    useState(matchingSuggestions)

  if (matchingSuggestions !== previousMatchingSuggestions) {
    setPreviousMatchingSuggestions(matchingSuggestions)
    setHighlightedSuggestionIndex(NO_HIGHLIGHTED_SUGGESTION_INDEX)
    setAreSuggestionsOpen(matchingSuggestions.length > 0)
  }

  const submit = (event: React.FormEvent): void => {
    event.preventDefault()
    closeSuggestions()

    controlledState?.setValue(inputValue)
  }

  const applySuggestion = (suggestion: string): void => {
    setInputValue(applySearchSuggestion(inputValue, suggestion))
    closeSuggestions()
  }

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (!areSuggestionsOpen) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedSuggestionIndex((previousIndex) =>
        previousIndex < matchingSuggestions.length - 1
          ? previousIndex + 1
          : NO_HIGHLIGHTED_SUGGESTION_INDEX
      )
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedSuggestionIndex((previousIndex) =>
        previousIndex > NO_HIGHLIGHTED_SUGGESTION_INDEX
          ? previousIndex - 1
          : matchingSuggestions.length - 1
      )
    }

    if (event.key === 'Enter' && highlightedSuggestionIndex !== NO_HIGHLIGHTED_SUGGESTION_INDEX) {
      event.preventDefault()
      applySuggestion(matchingSuggestions[highlightedSuggestionIndex])
    }

    if (event.key === 'Escape') {
      closeSuggestions()
    }
  }

  return {
    inputValue,
    setInputValue,
    submit,
    handleKeyDown,
    matchingSuggestions,
    areSuggestionsOpen,
    highlightedSuggestionIndex,
    openSuggestions,
    closeSuggestions,
    applySuggestion
  }
}

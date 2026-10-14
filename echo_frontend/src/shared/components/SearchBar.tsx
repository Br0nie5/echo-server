import {
  Box,
  Button,
  ClickAwayListener,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
  TextField,
  useTheme
} from '@mui/material'
import React, { memo, useState } from 'react'

import { useSearchBar } from '../hooks/useSearchBar'
import { useWindowSize } from '../hooks/useWindowSize'
import { useAppTranslation } from '../i18n/useAppTranslation'
import type { ControlledState } from '../types/controlledState'

interface SearchBarProps {
  /** The keys offered once the user types `:` in the last word, filtered by what follows it. */
  suggestions?: readonly string[]
  /** The hint displayed in the empty input, in place of the default one. */
  placeholder?: string
  /** The submitted search, held by the parent. */
  controlledState?: ControlledState<string>
}

const SearchBarComponent: React.FC<SearchBarProps> = ({
  suggestions,
  placeholder,
  controlledState
}) => {
  const translation = useAppTranslation()
  const theme = useTheme()
  const { isPortrait } = useWindowSize()

  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null)

  const {
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
  } = useSearchBar({ suggestions, controlledState })

  return (
    <Box sx={{ flex: 1, alignContent: 'center' }}>
      <form onSubmit={submit} onClick={openSuggestions}>
        <Stack
          direction={isPortrait ? 'column' : 'row'}
          spacing={
            isPortrait
              ? theme.dimensions.searchBar.portraitGap
              : theme.dimensions.searchBar.landscapeGap
          }
          sx={{ justifyContent: isPortrait ? undefined : 'space-between' }}
        >
          <Box ref={setAnchorElement} sx={{ flex: 1 }}>
            <TextField
              fullWidth
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder ?? translation('search.placeholder')}
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            sx={{
              mt: theme.dimensions.searchBar.buttonTopMargin,
              alignSelf: 'center'
            }}
          >
            {translation('search.button')}
          </Button>
        </Stack>
      </form>
      <Popper
        open={areSuggestionsOpen}
        anchorEl={anchorElement}
        placement="bottom-start"
        style={{ width: anchorElement?.offsetWidth }}
      >
        <ClickAwayListener onClickAway={closeSuggestions}>
          <Paper>
            <MenuList>
              {matchingSuggestions.map((suggestion, index) => (
                <MenuItem
                  key={suggestion}
                  selected={index === highlightedSuggestionIndex}
                  onClick={() => applySuggestion(suggestion)}
                >
                  {suggestion}:
                </MenuItem>
              ))}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  )
}

/**
 * A text input with a submit button, and optional suggestions.
 *
 * Every prop is optional. The component always holds the text being typed
 * itself: nothing is searched until the user submits it, with the button or
 * the Enter key.
 *
 * Without `controlledState`, submitting tells nobody:
 *
 * ```tsx
 * <SearchBar />
 * ```
 *
 * With `controlledState`, the parent holds the submitted search. Submitting
 * gives the text of the input to `controlledState.setValue`, and the input
 * displays `controlledState.value` at first and each time it changes.
 *
 * ```tsx
 * const [search, setSearch] = useState<string>('')
 *
 * <SearchBar
 *   suggestions={['jobId', 'message']}
 *   placeholder="Search a log..."
 *   controlledState={{ value: search, setValue: setSearch }}
 * />
 * ```
 */
export const SearchBar = memo(SearchBarComponent)

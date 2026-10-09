import {
  Box,
  Button,
  ClickAwayListener,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
  TextField
} from '@mui/material'
import { memo, type JSX } from 'react'

import { useSearchBar } from '../hooks/useSearchBar'
import type { ControlledState } from '../types/controlledState'

interface SearchBarProps {
  /** The keys offered once the user types `:` in the last word, filtered by what follows it. */
  suggestions?: string[]
  /** The hint displayed in the empty input, in place of the default one. */
  placeholder?: string
  /** The submitted search, held by the parent. */
  controlledState?: ControlledState<string>
}

const SearchBarComponent = ({
  suggestions,
  placeholder,
  controlledState
}: SearchBarProps): JSX.Element => {
  const {
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
  } = useSearchBar({ suggestions, controlledState })

  return (
    <Box sx={{ flex: 1, alignContent: 'center' }}>
      <form
        onSubmit={handleSubmit}
        onClick={() => updateShowSuggestions(filteredSuggestions.length)}
      >
        <Stack
          direction={isSmallScreen ? 'column' : 'row'}
          spacing={isSmallScreen ? 2 : 7}
          sx={{ justifyContent: isSmallScreen ? undefined : 'space-between' }}
        >
          <Box ref={setAnchorElement} sx={{ flex: 1 }}>
            <TextField
              fullWidth
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder ?? translation('utils.searchPlaceholder')}
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            sx={{
              mt: 1,
              alignSelf: 'center'
            }}
          >
            {translation('utils.searchButton')}
          </Button>
        </Stack>
      </form>
      <Popper
        open={showSuggestions}
        anchorEl={anchorElement}
        placement="bottom-start"
        style={{ width: anchorElement?.offsetWidth }}
      >
        <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
          <Paper>
            <MenuList>
              {filteredSuggestions.map((option, index) => (
                <MenuItem
                  key={option}
                  selected={index === suggestionIndex}
                  onClick={() => applySuggestion(option)}
                >
                  {option}:
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
export const SearchBar = memo(SearchBarComponent) as (props: SearchBarProps) => JSX.Element

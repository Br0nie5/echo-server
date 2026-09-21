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

interface SearchBarProps {
  suggestions?: string[]
  initialInputValue?: string
  onSearch: (search: string) => void
}

const SearchBarComponent = ({
  suggestions,
  initialInputValue,
  onSearch
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
  } = useSearchBar({ suggestions, initialInputValue, onSearch })

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
              placeholder={translation('logs.searchPlaceholder')}
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
            {translation('logs.searchButton')}
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

export const SearchBar = memo(SearchBarComponent) as (props: SearchBarProps) => JSX.Element

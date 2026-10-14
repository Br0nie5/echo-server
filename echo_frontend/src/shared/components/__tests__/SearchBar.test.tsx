import userEvent, { type UserEvent } from '@testing-library/user-event'
import { useState, type JSX } from 'react'

import { renderComponent } from '../../../test/renderComponent'
import { appTranslation } from '../../../test/utils/appTranslation'
import { SearchBar } from '../SearchBar'

let user: UserEvent

beforeEach(() => {
  user = userEvent.setup()
})

describe('SearchBar', () => {
  test('Should display the text the user types', async () => {
    const component = renderComponent(<SearchBar />)

    const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

    const userInputText = 'My custom input'
    await user.type(input, userInputText)

    expect(component.getByDisplayValue(userInputText)).toBeInTheDocument()
  })

  test('Should display the given placeholder in place of the default one', () => {
    const placeholder = 'My custom placeholder'

    const component = renderComponent(<SearchBar placeholder={placeholder} />)

    expect(component.getByPlaceholderText(placeholder)).toBeInTheDocument()
    expect(
      component.queryByPlaceholderText(appTranslation('utils.searchPlaceholder'))
    ).not.toBeInTheDocument()
  })

  describe('controlledState', () => {
    test('Should display the value of controlledState, and give it the submitted text', async () => {
      const initialSearch = 'initial search'
      const typedSearch = 'some text'
      const resetSearch = 'reset search'

      const resetSearchButtonLabel = 'Reset search'

      const setValue = vi.fn()

      const Parent = (): JSX.Element => {
        const [search, setSearch] = useState<string>(initialSearch)

        return (
          <>
            <SearchBar
              controlledState={{
                value: search,
                setValue: (newSearch) => {
                  setValue(newSearch)
                  setSearch(newSearch)
                }
              }}
            />
            <button onClick={() => setSearch(resetSearch)}>{resetSearchButtonLabel}</button>
          </>
        )
      }

      const component = renderComponent(<Parent />)

      const input = component.getByDisplayValue(initialSearch)

      await user.clear(input)
      await user.type(input, typedSearch)

      expect(setValue).not.toHaveBeenCalled()
      expect(component.getByDisplayValue(typedSearch)).toBeInTheDocument()

      await user.click(component.getByText(appTranslation('utils.searchButton')))

      expect(setValue).toHaveBeenCalledExactlyOnceWith(typedSearch)
      expect(component.getByDisplayValue(typedSearch)).toBeInTheDocument()

      await user.click(component.getByText(resetSearchButtonLabel))

      expect(component.queryByDisplayValue(typedSearch)).not.toBeInTheDocument()
      expect(component.getByDisplayValue(resetSearch)).toBeInTheDocument()
    })

    test('Should give the typed text to setValue when the user presses Enter', async () => {
      const setValue = vi.fn()

      const component = renderComponent(<SearchBar controlledState={{ value: '', setValue }} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      const userTextInput = 'some text'
      await user.type(input, userTextInput)

      expect(component.getByDisplayValue(userTextInput)).toBeInTheDocument()

      await user.keyboard('{Enter}')

      expect(setValue).toHaveBeenCalledExactlyOnceWith(userTextInput)
    })
  })

  describe('Suggestions', () => {
    test('Should show the suggestions once the user types a colon', async () => {
      const suggestion = 'color'

      const component = renderComponent(<SearchBar suggestions={[suggestion]} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      await user.type(input, 'some text then :')

      expect(component.getByText(`${suggestion}:`)).toBeInTheDocument()
    })

    test('Should only show the suggestions starting with what the user types after the colon', async () => {
      const suggestions = ['color', 'count', 'size']

      const component = renderComponent(<SearchBar suggestions={suggestions} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      await user.type(input, 'some text then :')

      suggestions.forEach((suggestion) => {
        expect(component.getByText(`${suggestion}:`)).toBeInTheDocument()
      })

      await user.type(input, 'co')

      suggestions.forEach((suggestion) => {
        if (suggestion.startsWith('co')) {
          expect(component.getByText(`${suggestion}:`)).toBeInTheDocument()
        } else {
          expect(component.queryByText(`${suggestion}:`)).not.toBeInTheDocument()
        }
      })
    })

    test('Should replace the colon with the suggestion the user clicks, and hide the suggestions', async () => {
      const suggestions = ['color', 'count', 'size']

      const component = renderComponent(<SearchBar suggestions={suggestions} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      const userInputBaseText = 'some text then '
      await user.type(input, `${userInputBaseText}:`)

      const firstSuggestion = component.getByText(`${suggestions[0]}:`)

      await user.click(firstSuggestion)

      expect(
        component.getByDisplayValue(`${userInputBaseText}${suggestions[0]}:`)
      ).toBeInTheDocument()
      expect(component.queryByRole('menuitem')).not.toBeInTheDocument()
    })

    test('Should replace the word before the colon too with the suggestion', async () => {
      const suggestions = ['color', 'count', 'size']

      const component = renderComponent(<SearchBar suggestions={suggestions} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      const userInputBaseText = 'some text then '
      const userInputLastWord = 'do'
      await user.type(input, `${userInputBaseText}${userInputLastWord}:`)

      const firstSuggestion = component.getByText(`${suggestions[0]}:`)

      await user.click(firstSuggestion)

      expect(
        component.getByDisplayValue(`${userInputBaseText}${suggestions[0]}:`)
      ).toBeInTheDocument()
    })

    test('Should keep the hyphen the word starts with when replacing it with the suggestion', async () => {
      const suggestions = ['color', 'count', 'size']

      const component = renderComponent(<SearchBar suggestions={suggestions} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      const userInputBaseText = 'some text then '
      const userInputLastWord = 'do'
      await user.type(input, `${userInputBaseText}-${userInputLastWord}:`)

      const firstSuggestion = component.getByText(`${suggestions[0]}:`)

      await user.click(firstSuggestion)

      expect(
        component.getByDisplayValue(`${userInputBaseText}-${suggestions[0]}:`)
      ).toBeInTheDocument()
    })

    test('Should replace the colon with the suggestion the user selects with the keyboard', async () => {
      const suggestions = ['color', 'count', 'size']

      const component = renderComponent(<SearchBar suggestions={suggestions} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      const userInputBaseText = 'some text then '
      await user.type(input, `${userInputBaseText}:`)

      await user.keyboard('{ArrowDown}')

      expect(component.getByRole('menuitem', { name: `${suggestions[0]}:` })).toHaveClass(
        'Mui-selected'
      )
      expect(component.getByRole('menuitem', { name: `${suggestions[1]}:` })).not.toHaveClass(
        'Mui-selected'
      )
      expect(component.getByRole('menuitem', { name: `${suggestions[2]}:` })).not.toHaveClass(
        'Mui-selected'
      )

      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowUp}')

      expect(component.getByRole('menuitem', { name: `${suggestions[1]}:` })).toHaveClass(
        'Mui-selected'
      )

      await user.keyboard('{Enter}')

      expect(
        component.getByDisplayValue(`${userInputBaseText}${suggestions[1]}:`)
      ).toBeInTheDocument()
    })

    test('Should loop through the suggestions when the user goes past the first or the last one', async () => {
      const suggestions = ['color', 'count', 'size']

      const component = renderComponent(<SearchBar suggestions={suggestions} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      await user.type(input, 'some text then :')

      await user.keyboard('{ArrowDown}')

      expect(component.getByRole('menuitem', { name: `${suggestions[0]}:` })).toHaveClass(
        'Mui-selected'
      )

      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')

      expect(component.getByRole('menuitem', { name: `${suggestions[0]}:` })).toHaveClass(
        'Mui-selected'
      )

      await user.keyboard('{ArrowUp}')
      await user.keyboard('{ArrowUp}')

      expect(component.getByRole('menuitem', { name: `${suggestions[2]}:` })).toHaveClass(
        'Mui-selected'
      )
    })

    test('Should not apply a suggestion when pressing Enter before selecting one', async () => {
      const suggestions = ['color', 'count', 'size']

      const component = renderComponent(<SearchBar suggestions={suggestions} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      const userInputBaseText = 'some text then '
      await user.type(input, `${userInputBaseText}:`)

      expect(component.getByText(`${suggestions[0]}:`)).toBeInTheDocument()

      await user.keyboard('{Enter}')

      expect(component.getByDisplayValue(`${userInputBaseText}:`)).toBeInTheDocument()
    })

    test('Should hide the suggestions when the user presses Escape', async () => {
      const suggestion = 'color'

      const component = renderComponent(<SearchBar suggestions={[suggestion]} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      await user.type(input, 'some text then :')

      expect(component.getByText(`${suggestion}:`)).toBeInTheDocument()

      await user.keyboard('{Escape}')

      expect(component.queryByText(`${suggestion}:`)).not.toBeInTheDocument()
    })
  })
})

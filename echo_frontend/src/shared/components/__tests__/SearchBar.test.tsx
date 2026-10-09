import userEvent, { type UserEvent } from '@testing-library/user-event'
import { useState, type JSX } from 'react'

import { renderComponent } from '../../../test/renderComponent'
import i18n from '../../i18n/i18n'
import type { AppTranslation } from '../../i18n/useAppTranslation'
import { SearchBar } from '../SearchBar'

const appTranslation: AppTranslation = (key) => i18n.t(key)

let user: UserEvent

beforeEach(() => {
  user = userEvent.setup()
})

describe('SearchBar', () => {
  test('Should display the text a user enter', async () => {
    const component = await renderComponent(<SearchBar />)

    const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

    const userInputText = 'My custom input'
    await user.type(input, userInputText)

    expect(component.getByDisplayValue(userInputText)).toBeInTheDocument()
  })

  test('Should display the given placeholder in place of the default one', async () => {
    const placeholder = 'My custom placeholder'

    const component = await renderComponent(<SearchBar placeholder={placeholder} />)

    expect(component.getByPlaceholderText(placeholder)).toBeInTheDocument()
    expect(
      component.queryByPlaceholderText(appTranslation('utils.searchPlaceholder'))
    ).not.toBeInTheDocument()
  })

  describe('controlledState', () => {
    test('Should display values from controlledState if given', async () => {
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

      const component = await renderComponent(<Parent />)

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

    test('Should give the input to setValue when pressing enter after writing my input', async () => {
      const setValue = vi.fn()

      const component = await renderComponent(
        <SearchBar controlledState={{ value: '', setValue }} />
      )

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      const userTextInput = 'some text'
      await user.type(input, userTextInput)

      expect(component.getByDisplayValue(userTextInput)).toBeInTheDocument()

      await user.keyboard('{Enter}')

      expect(setValue).toHaveBeenCalledExactlyOnceWith(userTextInput)
    })
  })

  describe('Suggestions', () => {
    test('Should show suggestions when using ":" writing helper', async () => {
      const suggestion = 'My super suggestion'

      const component = await renderComponent(<SearchBar suggestions={[suggestion]} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      await user.type(input, 'some text then :')

      expect(component.getByText(`${suggestion}:`)).toBeInTheDocument()
    })

    test('Should show filtered suggestions continuing writing after using ":" writing helper', async () => {
      const suggestions = ['1 suggestion', '2 suggestions', '3 suggestions']

      const component = await renderComponent(<SearchBar suggestions={suggestions} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      await user.type(input, 'some text then :')

      suggestions.forEach((suggestion) => {
        expect(component.getByText(`${suggestion}:`)).toBeInTheDocument()
      })

      await user.type(input, '1')

      suggestions.forEach((suggestion) => {
        if (suggestion.startsWith('1')) {
          expect(component.getByText(`${suggestion}:`)).toBeInTheDocument()
        } else {
          expect(component.queryByText(`${suggestion}:`)).not.toBeInTheDocument()
        }
      })
    })

    test('Should replace the writing helper ":" with the correct suggestion when clicking on one of the suggestions', async () => {
      const suggestions = ['1 suggestion', '2 suggestions', '3 suggestions']

      const component = await renderComponent(<SearchBar suggestions={suggestions} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      const userInputBaseText = 'some text then '
      await user.type(input, `${userInputBaseText}:`)

      const firstSuggestion = component.getByText(`${suggestions[0]}:`)

      await user.click(firstSuggestion)

      expect(
        component.getByDisplayValue(`${userInputBaseText}${suggestions[0]}:`)
      ).toBeInTheDocument()
    })

    test('Should replace the writing helper ":" alongside the word preceding it with the correct suggestion', async () => {
      const suggestions = ['1 suggestion', '2 suggestions', '3 suggestions']

      const component = await renderComponent(<SearchBar suggestions={suggestions} />)

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

    test('Should keep the hyphen "-" when replacing the writing helper ":" alongside the word preceding it with the correct suggestion', async () => {
      const suggestions = ['1 suggestion', '2 suggestions', '3 suggestions']

      const component = await renderComponent(<SearchBar suggestions={suggestions} />)

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

    test('Should replace the writing helper ":" with the correct suggestion when selecting a suggestion though the keyboard', async () => {
      const suggestions = ['1 suggestion', '2 suggestions', '3 suggestions']

      const component = await renderComponent(<SearchBar suggestions={suggestions} />)

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

    test('Should loop though the suggestions when going up or down to much', async () => {
      const suggestions = ['1 suggestion', '2 suggestions', '3 suggestions']

      const component = await renderComponent(<SearchBar suggestions={suggestions} />)

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
      const suggestions = ['1 suggestion', '2 suggestions', '3 suggestions']

      const component = await renderComponent(<SearchBar suggestions={suggestions} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      const userInputBaseText = 'some text then '
      await user.type(input, `${userInputBaseText}:`)

      expect(component.getByText(`${suggestions[0]}:`)).toBeInTheDocument()

      await user.keyboard('{Enter}')

      expect(component.getByDisplayValue(`${userInputBaseText}:`)).toBeInTheDocument()
    })

    test('Should hide suggestions when typing on Escape button', async () => {
      const suggestion = 'My super suggestion'

      const component = await renderComponent(<SearchBar suggestions={[suggestion]} />)

      const input = component.getByPlaceholderText(appTranslation('utils.searchPlaceholder'))

      await user.type(input, 'some text then :')

      expect(component.getByText(`${suggestion}:`)).toBeInTheDocument()

      await user.keyboard('{Escape}')

      expect(component.queryByText(`${suggestion}:`)).not.toBeInTheDocument()
    })
  })
})

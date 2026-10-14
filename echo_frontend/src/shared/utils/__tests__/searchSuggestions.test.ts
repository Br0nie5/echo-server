import { applySearchSuggestion, getSearchSuggestions } from '../searchSuggestions'

const suggestions = ['color', 'count', 'size']

describe('getSearchSuggestions', () => {
  it.each(['', 'error', 'color: error', 'color:co error'])(
    'Should give no suggestion for "%s", whose last word has no colon',
    (inputValue) => {
      expect(getSearchSuggestions(inputValue, suggestions)).toEqual([])
    }
  )

  it.each(['error :', ':', 'error -:', 'error co:'])(
    'Should give every suggestion for "%s", which ends with the colon',
    (inputValue) => {
      expect(getSearchSuggestions(inputValue, suggestions)).toEqual(suggestions)
    }
  )

  it.each(['color:', 'error color:co', '-size:', 'count:12'])(
    'Should give no suggestion for "%s", whose last word starts with a suggestion and the colon',
    (inputValue) => {
      expect(getSearchSuggestions(inputValue, suggestions)).toEqual([])
    }
  )

  it.each([
    { inputValue: 'error :co', matchingSuggestions: ['color', 'count'] },
    { inputValue: 'error :COL', matchingSuggestions: ['color'] },
    { inputValue: ':s', matchingSuggestions: ['size'] },
    { inputValue: 'error :weight', matchingSuggestions: [] }
  ])(
    'Should give $matchingSuggestions for "$inputValue", those starting with what follows the colon',
    ({ inputValue, matchingSuggestions }) => {
      expect(getSearchSuggestions(inputValue, suggestions)).toEqual(matchingSuggestions)
    }
  )
})

describe('applySearchSuggestion', () => {
  it.each([
    { inputValue: ':', newInputValue: 'color:' },
    { inputValue: 'error :co', newInputValue: 'error color:' },
    { inputValue: 'error co:', newInputValue: 'error color:' },
    { inputValue: 'error -:co', newInputValue: 'error -color:' },
    { inputValue: '-:', newInputValue: '-color:' }
  ])(
    'Should turn "$inputValue" into "$newInputValue", its last word replaced with the suggestion',
    ({ inputValue, newInputValue }) => {
      expect(applySearchSuggestion(inputValue, 'color')).toBe(newInputValue)
    }
  )
})

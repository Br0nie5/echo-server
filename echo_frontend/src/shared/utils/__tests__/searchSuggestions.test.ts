import { describe, expect, it } from 'vitest'

import { applySearchSuggestion, getSearchSuggestions } from '../searchSuggestions'

const suggestions = ['jobId', 'locationName', 'message', 'groupName']

describe('getSearchSuggestions', () => {
  it('Should return nothing when the last word has no key separator', () => {
    expect(getSearchSuggestions('error', suggestions)).toEqual([])
    expect(getSearchSuggestions('', suggestions)).toEqual([])
  })

  it('Should return every suggestion right after the separator', () => {
    expect(getSearchSuggestions('error :', suggestions)).toEqual(suggestions)
  })

  it('Should only return the suggestions starting with the typed text, ignoring case', () => {
    expect(getSearchSuggestions('error :LOC', suggestions)).toEqual(['locationName'])
  })
})

describe('applySearchSuggestion', () => {
  it('Should replace the last word by the suggestion', () => {
    expect(applySearchSuggestion('error :lo', 'locationName')).toBe('error locationName:')
  })

  it('Should keep the exclusion prefix', () => {
    expect(applySearchSuggestion('error -:lo', 'locationName')).toBe('error -locationName:')
  })
})

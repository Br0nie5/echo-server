import { describe, expect, it } from 'vitest'

import { applySearchSuggestion, getSearchSuggestions } from '../searchSuggestions'

const suggestions = ['jobId', 'fileName', 'message', 'groupName']

describe('getSearchSuggestions', () => {
  it('should return nothing when the last word has no key separator', () => {
    expect(getSearchSuggestions('error', suggestions)).toEqual([])
    expect(getSearchSuggestions('', suggestions)).toEqual([])
  })

  it('should return every suggestion right after the separator', () => {
    expect(getSearchSuggestions('error :', suggestions)).toEqual(suggestions)
  })

  it('should only return the suggestions starting with the typed text, ignoring case', () => {
    expect(getSearchSuggestions('error :FIL', suggestions)).toEqual(['fileName'])
  })
})

describe('applySearchSuggestion', () => {
  it('should replace the last word by the suggestion', () => {
    expect(applySearchSuggestion('error :fi', 'fileName')).toBe('error fileName:')
  })

  it('should keep the exclusion prefix', () => {
    expect(applySearchSuggestion('error -:fi', 'fileName')).toBe('error -fileName:')
  })
})

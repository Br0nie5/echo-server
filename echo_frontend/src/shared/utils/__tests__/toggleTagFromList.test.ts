import { describe, it, expect } from 'vitest'

import { toggleTagFromList } from '../toggleTagFromList'

describe('toggleTagFromList', () => {
  it('should add the tag when it is not already in the list', () => {
    const result = toggleTagFromList(['a', 'b'], 'c')
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('should remove the tag when it is already in the list', () => {
    const result = toggleTagFromList(['a', 'b', 'c'], 'b')
    expect(result).toEqual(['a', 'c'])
  })

  it('should handle empty list by adding the tag', () => {
    const result = toggleTagFromList([], 'x')
    expect(result).toEqual(['x'])
  })

  it('should work with string literal types', () => {
    type MyTags = 'x' | 'y' | 'z'
    const result = toggleTagFromList<MyTags>(['x'], 'y')
    expect(result).toEqual(['x', 'y'])
  })

  it('should return a new array (immutability)', () => {
    type MyTags = 'a' | 'b' | 'c'
    const prev: MyTags[] = ['a', 'b'] as const
    const result = toggleTagFromList<MyTags>(prev, 'c')
    expect(result).not.toBe(prev) // different reference
  })
})

import { describe, it, expect } from 'vitest'

import { getDirectoriesLinkedName } from '../getDirectoriesLinkedName.js'

describe('getDirectoriesLinkedName', () => {
  it('should return the directories linked name for a relative path', () => {
    expect(getDirectoriesLinkedName('folder/subfolder1/subfolder2/log/file.txt')).toBe(
      'subfolder1_subfolder2'
    )
  })

  it('should return the directories linked name for an absolute path', () => {
    expect(getDirectoriesLinkedName('/folder/subfolder1/subfolder2/file.txt')).toBe(
      'subfolder1_subfolder2'
    )
  })

  it('should return undefined for a single file', () => {
    expect(getDirectoriesLinkedName('/file.txt')).toBeUndefined()
    expect(getDirectoriesLinkedName('file.txt')).toBeUndefined()
  })
})

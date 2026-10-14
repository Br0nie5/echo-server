import { describe, expect, it } from 'vitest'

import { FileDoesNotExistError } from '../fileDoesNotExistError.js'

describe('FileDoesNotExistError', () => {
  it('Should be an error named after itself, whose message gives the path of the file', () => {
    const error = new FileDoesNotExistError('/data/last_check.json')

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('FileDoesNotExistError')
    expect(error.message).toBe('The file /data/last_check.json does not exist')
  })
})

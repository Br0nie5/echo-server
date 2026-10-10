import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, test } from 'vitest'

import { isUnauthorizedError } from '../isUnauthorizedError'

const buildAxiosError = (status: number): AxiosError =>
  new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    statusText: '',
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() }
  })

describe('isUnauthorizedError', () => {
  test('Should be true for an axios error with a 401 status', () => {
    expect(isUnauthorizedError(buildAxiosError(401))).toBe(true)
  })

  test('Should be false for an axios error with another status', () => {
    expect(isUnauthorizedError(buildAxiosError(403))).toBe(false)
  })

  test('Should be false for an error that is not an axios one', () => {
    expect(isUnauthorizedError(new Error('401'))).toBe(false)
  })
})

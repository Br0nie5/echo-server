import { describe, it, expect } from 'vitest'

import { parseConfig } from '../parseConfig.js'

const env = {
  SERVER_NAME: 'my-server',
  HAS_AUTHENTICATION: 'true'
}

describe('parseConfig', () => {
  it.each([
    { rawHasAuthentication: 'true', hasAuthentication: true },
    { rawHasAuthentication: 'false', hasAuthentication: false }
  ])(
    'Should build the config from its variables, HAS_AUTHENTICATION being $rawHasAuthentication',
    ({ rawHasAuthentication, hasAuthentication }) => {
      expect(parseConfig({ ...env, HAS_AUTHENTICATION: rawHasAuthentication })).toEqual({
        serverName: 'my-server',
        hasAuthentication
      })
    }
  )

  it('Should leave out the variables that are not those of the config', () => {
    expect(parseConfig({ ...env, ANOTHER_VARIABLE: 'another value' })).toEqual({
      serverName: 'my-server',
      hasAuthentication: true
    })
  })

  it.each(['SERVER_NAME', 'HAS_AUTHENTICATION'])('Should throw when %s is missing', (name) => {
    expect(() => parseConfig({ ...env, [name]: undefined })).toThrow(
      new Error(`Missing required environment variable: ${name}`)
    )
  })

  it('Should throw, naming HAS_AUTHENTICATION, when it is neither true nor false', () => {
    expect(() => parseConfig({ ...env, HAS_AUTHENTICATION: 'not-a-boolean' })).toThrow(
      new Error('HAS_AUTHENTICATION: Invalid boolean: not-a-boolean is neither true nor false')
    )
  })
})

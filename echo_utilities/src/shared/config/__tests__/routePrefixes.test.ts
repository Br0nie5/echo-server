import { describe, it, expect } from 'vitest'

import { apiRoutePrefix, appRoutePrefix } from '../routePrefixes.js'

describe('apiRoutePrefix', () => {
  it('Should be /api', () => {
    expect(apiRoutePrefix).toBe('/api')
  })
})

describe('appRoutePrefix', () => {
  it('Should be /app', () => {
    expect(appRoutePrefix).toBe('/app')
  })
})

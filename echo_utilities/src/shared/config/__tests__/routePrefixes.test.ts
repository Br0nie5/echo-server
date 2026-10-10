import { describe, it, expect } from 'vitest'

import { apiRoutePrefix, appRoutePrefix } from '../routePrefixes.js'

// The Vite dev server (its proxy and its base) and the documentation write these paths out.
describe('route prefixes', () => {
  it('Should keep the API under /api and the frontend under /app', () => {
    expect(apiRoutePrefix).toBe('/api')
    expect(appRoutePrefix).toBe('/app')
  })
})

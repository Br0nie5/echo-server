import { describe, expect, it } from 'vitest'

import { removeBasePath } from '../removeBasePath.js'

describe('removeBasePath', () => {
  it('Should remove the base path from a URL below it, keeping the query', () => {
    expect(removeBasePath('/echo/api/logs', '/echo')).toBe('/api/logs')
    expect(removeBasePath('/tools/echo/api/logs?fromDate=2026', '/tools/echo')).toBe(
      '/api/logs?fromDate=2026'
    )
  })

  it('Should give the root for the base path itself', () => {
    expect(removeBasePath('/echo', '/echo')).toBe('/')
    expect(removeBasePath('/echo/', '/echo')).toBe('/')
    expect(removeBasePath('/echo?tab=logs', '/echo')).toBe('/?tab=logs')
  })

  it('Should leave a URL that is not below the base path as it is', () => {
    expect(removeBasePath('/api/logs', '/echo')).toBe('/api/logs')
    expect(removeBasePath('/echoes/api/logs', '/echo')).toBe('/echoes/api/logs')
  })

  it('Should leave every URL as it is when the base path is empty', () => {
    expect(removeBasePath('/api/logs', '')).toBe('/api/logs')
  })
})

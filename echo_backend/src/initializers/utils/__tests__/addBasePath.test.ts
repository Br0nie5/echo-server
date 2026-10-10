import { describe, expect, it } from 'vitest'

import { addBasePath } from '../addBasePath.js'

describe('addBasePath', () => {
  it('Should put a path of the server below the base path, keeping its query', () => {
    expect(addBasePath('/documentation/', '/echo')).toBe('/echo/documentation/')
    expect(addBasePath('/app/logs?tab=1', '/tools/echo')).toBe('/tools/echo/app/logs?tab=1')
  })

  it('Should put a path that only starts like the base path below it', () => {
    expect(addBasePath('/echoes', '/echo')).toBe('/echo/echoes')
  })

  it('Should leave a path already below the base path as it is', () => {
    expect(addBasePath('/echo/documentation/', '/echo')).toBe('/echo/documentation/')
    expect(addBasePath('/echo', '/echo')).toBe('/echo')
  })

  it.each(['https://domain.com/docs', '//domain.com/docs', './static/index.html'])(
    'Should leave %s, which is not a path of this origin, as it is',
    (location) => {
      expect(addBasePath(location, '/echo')).toBe(location)
    }
  )

  it('Should leave every location as it is when the base path is empty', () => {
    expect(addBasePath('/documentation/', '')).toBe('/documentation/')
  })
})

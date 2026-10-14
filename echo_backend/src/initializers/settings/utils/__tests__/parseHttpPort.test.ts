import { describe, it, expect } from 'vitest'

import { parseHttpPort } from '../parseHttpPort.js'

describe('parseHttpPort', () => {
  it.each([
    { raw: '1', port: 1 },
    { raw: '3000', port: 3000 },
    { raw: '65535', port: 65535 }
  ])('Should parse "$raw", which is between 1 and 65535', ({ raw, port }) => {
    expect(parseHttpPort(raw)).toBe(port)
  })

  it.each(['0', '-80', '65536'])('Should throw if the port is out of range ("%s")', (raw) => {
    expect(() => parseHttpPort(raw)).toThrow(`Invalid port: ${raw} is not between 1 and 65535`)
  })
})

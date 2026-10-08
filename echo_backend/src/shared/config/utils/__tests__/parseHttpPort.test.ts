import { describe, it, expect } from 'vitest'

import { parseHttpPort } from '../parseHttpPort.js'

describe('parseHttpPort', () => {
  it('should return the port as a number', () => {
    expect(parseHttpPort('3000')).toBe(3000)
  })

  it('should accept the lowest and the highest ports', () => {
    expect(parseHttpPort('1')).toBe(1)
    expect(parseHttpPort('65535')).toBe(65535)
  })

  it('should throw if the port is not a number', () => {
    expect(() => parseHttpPort('not-a-number')).toThrow('Invalid HTTP_PORT: not-a-number')
  })

  it('should throw if the port is not an integer', () => {
    expect(() => parseHttpPort('3000.5')).toThrow('Invalid HTTP_PORT: 3000.5')
  })

  it('should throw if the port is out of range', () => {
    expect(() => parseHttpPort('70000')).toThrow('Invalid HTTP_PORT: 70000')
  })

  it('should throw if the port is not a positive number', () => {
    expect(() => parseHttpPort('0')).toThrow('Invalid HTTP_PORT: 0')
  })
})

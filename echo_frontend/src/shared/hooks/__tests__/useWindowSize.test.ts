import { renderHook, act } from '@testing-library/react'

import { resizeWindow } from '../../../test/utils/resizeWindow'
import { useWindowSize } from '../useWindowSize'

describe('useWindowSize', () => {
  describe('windowSize', () => {
    it('should return the width and height of the window', () => {
      resizeWindow(400, 800)
      const { result } = renderHook(() => useWindowSize())
      expect(result.current.windowSize).toStrictEqual({ width: 400, height: 800 })
    })

    it('should update when the window is resized', () => {
      resizeWindow(400, 800)
      const { result } = renderHook(() => useWindowSize())

      // Resize window
      act(() => {
        window.innerWidth = 500
        window.innerHeight = 900
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.windowSize).toStrictEqual({ width: 500, height: 900 })
    })
  })

  describe('isSmallScreen', () => {
    it('should return true when height > width (portrait)', () => {
      resizeWindow(400, 800)
      const { result } = renderHook(() => useWindowSize())
      expect(result.current.isSmallScreen).toBe(true)
    })

    it('should return false when width > height (landscape)', () => {
      resizeWindow(1200, 600)
      const { result } = renderHook(() => useWindowSize())
      expect(result.current.isSmallScreen).toBe(false)
    })

    it('should return false when width = height (landscape)', () => {
      resizeWindow(600, 600)
      const { result } = renderHook(() => useWindowSize())
      expect(result.current.isSmallScreen).toBe(false)
    })

    it('should update when window is resized', () => {
      resizeWindow(500, 1000)
      const { result } = renderHook(() => useWindowSize())
      expect(result.current.isSmallScreen).toBe(true)

      act(() => {
        resizeWindow(1500, 600)
      })

      expect(result.current.isSmallScreen).toBe(false)
    })
  })
})

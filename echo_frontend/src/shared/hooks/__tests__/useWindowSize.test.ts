import { renderHook, act } from '@testing-library/react'

import { resizeWindow } from '../../../test/utils/resizeWindow'
import { useWindowSize } from '../useWindowSize'

describe('useWindowSize', () => {
  it('Should return the width and height of the window', () => {
    resizeWindow(400, 800)
    const { result } = renderHook(() => useWindowSize())
    expect(result.current.windowSize).toStrictEqual({ width: 400, height: 800 })
  })

  it('Should update the size, and whether the screen is small, when the window is resized', () => {
    resizeWindow(400, 800)
    const { result } = renderHook(() => useWindowSize())

    act(() => {
      resizeWindow(1500, 600)
    })

    expect(result.current).toStrictEqual({
      windowSize: { width: 1500, height: 600 },
      isSmallScreen: false
    })
  })

  describe('isSmallScreen', () => {
    it('Should return true when height > width (portrait)', () => {
      resizeWindow(400, 800)
      const { result } = renderHook(() => useWindowSize())
      expect(result.current.isSmallScreen).toBe(true)
    })

    it('Should return false when width > height (landscape)', () => {
      resizeWindow(1200, 600)
      const { result } = renderHook(() => useWindowSize())
      expect(result.current.isSmallScreen).toBe(false)
    })

    it('Should return false when width = height (landscape)', () => {
      resizeWindow(600, 600)
      const { result } = renderHook(() => useWindowSize())
      expect(result.current.isSmallScreen).toBe(false)
    })
  })
})

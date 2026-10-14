import { renderHook, act } from '@testing-library/react'

import { resizeWindow } from '../../../test/utils/resizeWindow'
import { useWindowSize } from '../useWindowSize'

describe('useWindowSize', () => {
  it('Should update the size, and whether the window is in portrait, when it is resized', () => {
    resizeWindow(400, 800)
    const { result } = renderHook(() => useWindowSize())

    act(() => {
      resizeWindow(1500, 600)
    })

    expect(result.current).toStrictEqual({
      windowSize: { width: 1500, height: 600 },
      isPortrait: false
    })
  })

  describe('isPortrait', () => {
    it('Should return true when height > width (portrait)', () => {
      resizeWindow(400, 800)
      const { result } = renderHook(() => useWindowSize())
      expect(result.current.isPortrait).toBe(true)
    })

    it('Should return false when width > height (landscape)', () => {
      resizeWindow(1200, 600)
      const { result } = renderHook(() => useWindowSize())
      expect(result.current.isPortrait).toBe(false)
    })

    it('Should return false when width = height (square)', () => {
      resizeWindow(600, 600)
      const { result } = renderHook(() => useWindowSize())
      expect(result.current.isPortrait).toBe(false)
    })
  })
})

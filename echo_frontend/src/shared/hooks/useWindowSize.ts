import { useEffect, useState } from 'react'

/** The size of the window, in pixels. */
export interface WindowSize {
  width: number
  height: number
}

/**
 * Gives the size of the window, kept up to date when it is resized.
 *
 * A window taller than it is wide counts as a small screen.
 */
export const useWindowSize = (): {
  windowSize: WindowSize
  isSmallScreen: boolean
} => {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight
  })

  useEffect(() => {
    const handleResize = (): void => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return (): void => window.removeEventListener('resize', handleResize)
  }, [])

  return { windowSize, isSmallScreen: windowSize.width < windowSize.height }
}

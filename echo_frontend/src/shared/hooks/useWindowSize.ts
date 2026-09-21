import { useEffect, useState } from 'react'

/** Size of the window, in pixels. */
export interface WindowSize {
  width: number
  height: number
}

/** The window size, kept up to date on resize. A window taller than it is wide counts as a small screen. */
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

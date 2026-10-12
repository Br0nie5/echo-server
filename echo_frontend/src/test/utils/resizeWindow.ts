/**
 * Gives the window of the tests the size of `width` by `height` pixels, and tells the page.
 *
 * Inside a rendered component, wrap it in `act`, as it changes what the component displays.
 *
 * ```ts
 * resizeWindow(1200, 600)
 * ```
 */
export const resizeWindow = (width: number, height: number): void => {
  ;(window.innerWidth as number) = width
  ;(window.innerHeight as number) = height
  window.dispatchEvent(new Event('resize'))
}

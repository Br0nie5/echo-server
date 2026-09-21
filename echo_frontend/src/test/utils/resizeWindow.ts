export const resizeWindow = (width: number, height: number): void => {
  ;(window.innerWidth as number) = width
  ;(window.innerHeight as number) = height
  window.dispatchEvent(new Event('resize'))
}

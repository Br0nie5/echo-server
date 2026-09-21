import { useEffect } from 'react'

/** Sets the browser tab title. */
export const useScreenTitle = (title: string): void => {
  useEffect(() => {
    document.title = title
  }, [title])
}

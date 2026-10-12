import { useEffect } from 'react'

/** Sets the title of the browser tab to `title`. */
export const useScreenTitle = (title: string): void => {
  useEffect(() => {
    document.title = title
  }, [title])
}

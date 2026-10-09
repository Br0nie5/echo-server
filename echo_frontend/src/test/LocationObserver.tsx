import { useEffect } from 'react'
import { useLocation, type Location } from 'react-router-dom'

type LocationObserverProps = {
  onLocationChange: (location: Location) => void
}

/**
 * Tells a test the location of the router it is rendered in.
 *
 * It displays nothing, and calls `onLocationChange` with the location at first and each time it
 * changes. `renderApp` renders it when it is given an `onLocationChange`.
 */
export const LocationObserver = ({ onLocationChange }: LocationObserverProps): null => {
  const location = useLocation()

  useEffect(() => {
    onLocationChange(location)
  }, [location, onLocationChange])

  return null
}

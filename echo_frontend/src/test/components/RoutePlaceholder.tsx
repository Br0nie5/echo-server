import { useLocation } from 'react-router-dom'

import { getRouteTestId } from '../utils/getRouteTestId'

/**
 * Stands for a screen that is not the tested one, in the app of `renderFakeRouterApp`.
 *
 * It is an empty box, whose test id `getRouteTestId` gives for the path the app is at.
 */
export const RoutePlaceholder = (): React.ReactElement => {
  const { pathname, search } = useLocation()

  return <div data-testid={getRouteTestId(`${pathname}${search}`)} />
}

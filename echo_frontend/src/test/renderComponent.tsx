import type { RenderResult } from '@testing-library/react'
import { render } from '@testing-library/react'

import '../shared/i18n/i18n.ts'

import { AppThemeWrapper } from './components/AppThemeWrapper.tsx'

/**
 * Renders `child` alone, with the look and the translations of the app.
 *
 * It is for a component that needs neither the config, the API nor the router, such as those of
 * `shared/`: a screen is rendered by `renderFakeRouterApp` or `renderRealRouterApp`.
 *
 * ```tsx
 * const component = renderComponent(<SearchBar placeholder="Search a log..." />)
 * ```
 */
export const renderComponent = (child: React.ReactElement): RenderResult =>
  render(<AppThemeWrapper>{child}</AppThemeWrapper>)

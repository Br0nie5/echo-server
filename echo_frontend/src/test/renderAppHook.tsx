import { QueryClientProvider } from '@tanstack/react-query'
import type { RenderHookResult } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import type { Location } from 'react-router-dom'

import { queryClient } from '../initializers/api/queryClient'
import type { FrontConfig } from '../shared/config/frontConfig'
import { AppPathNames } from '../shared/navigation/pathNames'

import { AppContextsWrapper } from './components/AppContextsWrapper'
import { AppRouterWrapper } from './components/AppRouterWrapper'

/**
 * Renders `hook` inside the contexts of the app and a router whose `basename` is the path of
 * `appUrl`, as `AppRouter` does.
 *
 * It is for a hook that needs the config, the API or the router, tested on its own: the config is
 * `params.configOverride`, or the one `buildMockConfig` builds for the current date, given at once,
 * without being loaded.
 *
 * `params.path` is the path, below `appUrl`, the router starts at: the logs screen when left out.
 * To check where the hook navigates, give `params.onLocationChange`: it is called with the location
 * at first and each time it changes.
 *
 * ```tsx
 * const { result } = renderAppHook(() => useSendApiRequest(), { onLocationChange })
 * ```
 */
export const renderAppHook = <Result,>(
  hook: () => Result,
  params?: {
    configOverride?: FrontConfig
    path?: string
    onLocationChange?: (location: Location) => void
  }
): RenderHookResult<Result, void> => {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <AppContextsWrapper config={params?.configOverride}>
        <AppRouterWrapper
          initialPath={params?.path ?? AppPathNames.logs}
          appUrl={params?.configOverride?.appUrl}
          onLocationChange={params?.onLocationChange}
        >
          {children}
        </AppRouterWrapper>
      </AppContextsWrapper>
    </QueryClientProvider>
  )

  return renderHook(hook, { wrapper })
}

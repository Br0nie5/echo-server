import { QueryClientProvider } from '@tanstack/react-query'
import type { RenderResult } from '@testing-library/react'
import { render, waitForElementToBeRemoved } from '@testing-library/react'
import nock from 'nock'

import '../shared/i18n/i18n.ts'

import { ApiProvider } from '../initializers/api/ApiProvider.tsx'
import { queryClient } from '../initializers/api/queryClient.ts'
import {
  configJsonUrl,
  configPageTestId,
  ConfigProvider
} from '../initializers/config/ConfigProvider.tsx'
import type { FrontConfig } from '../shared/config/frontConfig.ts'

import { AppThemeWrapper } from './utils/AppThemeWrapper.tsx'
import { mockConfig } from './utils/mockConfig.ts'
import { mockUrl } from './utils/mockUrl.ts'

/**
 * Renders `child` inside the providers of the app, once its config is loaded.
 *
 * The config is served as `env.<mode>.json`: `mockConfig`, or `params.configOverride`.
 *
 * ```tsx
 * const screen = await renderComponent(<AppRouter />)
 * ```
 */
export const renderComponent = async (
  child: React.ReactElement,
  params?: { configOverride?: FrontConfig }
): Promise<RenderResult> => {
  nock(mockUrl)
    .get(configJsonUrl)
    .reply(200, params?.configOverride ?? mockConfig)

  const screen = render(
    <AppThemeWrapper>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider>
          <ApiProvider>{child}</ApiProvider>
        </ConfigProvider>
      </QueryClientProvider>
    </AppThemeWrapper>
  )

  await waitForElementToBeRemoved(screen.getByTestId(configPageTestId))

  return screen
}

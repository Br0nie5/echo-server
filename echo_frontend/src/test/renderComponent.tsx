import type { Config } from '@echo/utilities'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { QueryClientProvider } from '@tanstack/react-query'
import type { RenderResult } from '@testing-library/react'
import { render, waitForElementToBeRemoved } from '@testing-library/react'
import nock from 'nock'

import '../shared/i18n/i18n.ts'

import { ApiProvider } from '../initializers/api/ApiProvider.tsx'
import { queryClient } from '../initializers/api/queryClient.ts'
import {
  configJsonBaseUrl,
  configPageTestId,
  ConfigProvider
} from '../initializers/config/ConfigProvider.tsx'
import { theme } from '../shared/theme'

import { testConfig } from './utils/config.ts'
import { testUrl } from './utils/url.ts'

export const renderComponent = async (
  child: React.ReactElement,
  params?: { configOverride?: Config }
): Promise<RenderResult> => {
  queryClient.setDefaultOptions({
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0
    }
  })

  nock(testUrl)
    .get(configJsonBaseUrl)
    .reply(200, params?.configOverride ?? testConfig)

  const screen = render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider>
            <ApiProvider>{child}</ApiProvider>
          </ConfigProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </ThemeProvider>
  )

  await waitForElementToBeRemoved(screen.getByTestId(configPageTestId))

  return screen
}

import type { EchoEnv } from '@echo/utilities'
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
import { envJsonBaseUrl, envPageTestId, EnvProvider } from '../initializers/env/EnvProvider.tsx'
import { theme } from '../shared/theme'

import { testEnv } from './utils/env.ts'
import { testUrl } from './utils/url.ts'

export const renderComponent = async (
  child: React.ReactElement,
  params?: { envOverride?: EchoEnv }
): Promise<RenderResult> => {
  queryClient.setDefaultOptions({
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0
    }
  })

  nock(testUrl)
    .get(envJsonBaseUrl)
    .reply(200, params?.envOverride ?? testEnv)

  const screen = render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <QueryClientProvider client={queryClient}>
          <EnvProvider>
            <ApiProvider>{child}</ApiProvider>
          </EnvProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </ThemeProvider>
  )

  await waitForElementToBeRemoved(screen.getByTestId(envPageTestId))

  return screen
}

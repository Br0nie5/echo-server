import { CssBaseline, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { ApiProvider } from './initializers/api/ApiProvider'
import { queryClient } from './initializers/api/queryClient'
import { ConfigProvider } from './initializers/config/ConfigProvider'
import { AppRouter } from './initializers/navigation/AppRouter'
import { theme } from './shared/theme'

/** Root component. The config is loaded before the API client is created, and the router is only rendered once both are ready. */
export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider>
            <ApiProvider>
              <AppRouter />
            </ApiProvider>
          </ConfigProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

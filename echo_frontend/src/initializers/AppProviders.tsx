import { CssBaseline, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { theme } from '../shared/theme'

import { ApiProvider } from './api/ApiProvider'
import { queryClient } from './api/queryClient'
import { ConfigProvider } from './config/ConfigProvider'

/**
 * Provides its children with everything a screen needs but the router: the theme, the localization
 * of the date pickers, the query client, the config and the API client.
 *
 * The config is loaded before the API client is created, and the children are only rendered once
 * both are ready.
 *
 * ```tsx
 * <AppProviders>
 *   <AppRouter />
 * </AppProviders>
 * ```
 */
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider>
            <ApiProvider>{children}</ApiProvider>
          </ConfigProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

import type { Config } from '@echo/utilities'
import { QueryClientProvider } from '@tanstack/react-query'
import type { RenderHookResult } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import axios from 'axios'

import { ApiContext } from '../initializers/api/ApiContext'
import { queryClient } from '../initializers/api/queryClient'
import { ConfigContext } from '../initializers/config/ConfigContext'

import { testConfig } from './utils/config'

export const renderAppHook = <Result,>(
  hook: () => Result,
  params?: { configOverride?: Config }
): RenderHookResult<Result, void> => {
  queryClient.setDefaultOptions({
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0
    }
  })

  const config = params?.configOverride ?? testConfig

  const axiosInstance = axios.create({ baseURL: config.API_URL, withCredentials: true })

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <ConfigContext.Provider value={{ config }}>
        <ApiContext.Provider value={{ axiosInstance }}>{children}</ApiContext.Provider>
      </ConfigContext.Provider>
    </QueryClientProvider>
  )

  return renderHook(hook, { wrapper })
}

import type { EchoEnv } from '@echo/utilities'
import { QueryClientProvider } from '@tanstack/react-query'
import type { RenderHookResult } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import axios from 'axios'

import { ApiContext } from '../initializers/api/ApiContext'
import { queryClient } from '../initializers/api/queryClient'
import { EnvContext } from '../initializers/env/EnvContext'

import { testEnv } from './utils/env'

export const renderAppHook = <Result,>(
  hook: () => Result,
  params?: { envOverride?: EchoEnv }
): RenderHookResult<Result, void> => {
  queryClient.setDefaultOptions({
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0
    }
  })

  const env = params?.envOverride ?? testEnv

  const axiosInstance = axios.create({ baseURL: env.API_URL, withCredentials: true })

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <EnvContext.Provider value={{ env }}>
        <ApiContext.Provider value={{ axiosInstance }}>{children}</ApiContext.Provider>
      </EnvContext.Provider>
    </QueryClientProvider>
  )

  return renderHook(hook, { wrapper })
}

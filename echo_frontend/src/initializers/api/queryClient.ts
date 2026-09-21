import type { QueryClientConfig } from '@tanstack/react-query'
import { QueryClient } from '@tanstack/react-query'

/** Query results are considered fresh for 5 minutes. */
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000
    }
  }
}

export const queryClient = new QueryClient(queryClientConfig)

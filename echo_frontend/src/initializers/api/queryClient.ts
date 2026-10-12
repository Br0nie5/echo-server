import type { QueryClientConfig } from '@tanstack/react-query'
import { QueryClient } from '@tanstack/react-query'

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000
    }
  }
}

/** The query client of the app, which considers the result of a query fresh for 5 minutes. */
export const queryClient = new QueryClient(queryClientConfig)

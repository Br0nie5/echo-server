import type { AxiosInstance } from 'axios'
import { createContext } from 'react'

/** What the `ApiProvider` of `initializers/` provides. */
export interface ApiContextValue {
  axiosInstance: AxiosInstance
}

/** Holds the axios instance, `null` outside of `ApiProvider`. Read it through `useApi`. */
export const ApiContext = createContext<ApiContextValue | null>(null)

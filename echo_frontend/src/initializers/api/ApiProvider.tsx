import axios from 'axios'
import { useMemo } from 'react'

import { ApiContext, type ApiContextValue } from '../../shared/api/ApiContext'
import { useConfig } from '../../shared/config/useConfig'

/** Provides an axios instance targeting `API_URL`, sending cookies with each request. */
export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { API_URL } = useConfig()

  const apiContextValue = useMemo<ApiContextValue>(
    () => ({ axiosInstance: axios.create({ baseURL: API_URL, withCredentials: true }) }),
    [API_URL]
  )

  return <ApiContext.Provider value={apiContextValue}>{children}</ApiContext.Provider>
}

import axios from 'axios'
import { useMemo } from 'react'

import { ApiContext, type ApiContextValue } from '../../shared/api/ApiContext'
import { useConfig } from '../../shared/config/useConfig'

/**
 * Provides its children with an axios instance targeting `apiUrl`, sending the cookies with each
 * request.
 */
export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { apiUrl } = useConfig()

  const apiContextValue = useMemo<ApiContextValue>(
    () => ({ axiosInstance: axios.create({ baseURL: apiUrl, withCredentials: true }) }),
    [apiUrl]
  )

  return <ApiContext.Provider value={apiContextValue}>{children}</ApiContext.Provider>
}

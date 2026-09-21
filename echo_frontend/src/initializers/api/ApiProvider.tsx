import axios from 'axios'

import { useEnv } from '../../shared/env/useEnv'

import { ApiContext } from './ApiContext'

/** Provides an axios instance targeting `API_URL`, sending cookies with each request. */
export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const env = useEnv()

  const axiosInstance = axios.create({
    baseURL: env.API_URL,
    withCredentials: true
  })

  return <ApiContext.Provider value={{ axiosInstance }}>{children}</ApiContext.Provider>
}

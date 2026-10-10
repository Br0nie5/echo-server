import { type AxiosInstance } from 'axios'
import { useContext } from 'react'

import { ApiContext } from './ApiContext'

/** The shared axios instance. Throws outside of `ApiProvider`. */
export const useApi = (): AxiosInstance => {
  const context = useContext(ApiContext)
  if (!context) {
    throw new Error('useApi must be used within ApiProvider')
  }
  return context.axiosInstance
}

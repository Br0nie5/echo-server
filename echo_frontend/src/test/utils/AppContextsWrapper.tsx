import axios from 'axios'

import { ApiContext } from '../../shared/api/ApiContext'
import { ConfigContext } from '../../shared/config/ConfigContext'
import type { FrontConfig } from '../../shared/config/frontConfig'

import { mockConfig } from './mockConfig'

interface AppContextsWrapperProps {
  /** The config given to the children: `mockConfig` when left out. */
  config?: FrontConfig
  children: React.ReactNode
}

/**
 * Gives its children the config and the API client of the app at once, as `ConfigProvider` and
 * `ApiProvider` do once the config is loaded, without loading it: for a hook, which cannot wait for
 * it.
 */
export const AppContextsWrapper: React.FC<AppContextsWrapperProps> = ({
  config = mockConfig,
  children
}) => {
  const axiosInstance = axios.create({ baseURL: config.API_URL, withCredentials: true })

  return (
    <ConfigContext.Provider value={{ config }}>
      <ApiContext.Provider value={{ axiosInstance }}>{children}</ApiContext.Provider>
    </ConfigContext.Provider>
  )
}

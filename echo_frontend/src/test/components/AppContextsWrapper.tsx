import axios from 'axios'

import { ApiContext } from '../../shared/api/ApiContext'
import { ConfigContext } from '../../shared/config/ConfigContext'
import type { FrontConfig } from '../../shared/config/frontConfig'
import { buildMockConfig } from '../mocks/mockConfig'

interface AppContextsWrapperProps {
  /**
   * The config given to the children: when left out, the one `buildMockConfig` builds for the
   * current date, the fake one when the test sets it.
   */
  config?: FrontConfig
  children: React.ReactNode
}

/**
 * Gives its children the config and the API client of the app at once, as `ConfigProvider` and
 * `ApiProvider` do once the config is loaded, without loading it.
 *
 * It is for a hook, which cannot wait for the config.
 */
export const AppContextsWrapper: React.FC<AppContextsWrapperProps> = ({
  config = buildMockConfig(new Date()),
  children
}) => {
  const axiosInstance = axios.create({ baseURL: config.apiUrl, withCredentials: true })

  return (
    <ConfigContext.Provider value={{ config }}>
      <ApiContext.Provider value={{ axiosInstance }}>{children}</ApiContext.Provider>
    </ConfigContext.Provider>
  )
}

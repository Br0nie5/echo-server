import { useQuery } from '@tanstack/react-query'

import { ConfigContext } from '../../shared/config/ConfigContext'
import { parseFrontConfig } from '../../shared/config/utils/parseFrontConfig'
import { ErrorLayout } from '../../shared/layouts/ErrorLayout'
import { LoadingLayout } from '../../shared/layouts/LoadingLayout'
import { PageLayout } from '../../shared/layouts/PageLayout'

/**
 * The URL of the `env.<mode>.json` file the config is parsed from.
 *
 * The file is written where the app is deployed, not when it is built, so one build fits any
 * deployment.
 */
export const configJsonUrl = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/env.${import.meta.env.MODE}.json`

/**
 * Loads and validates the config of the app once, and provides it to its children.
 *
 * The children are only rendered with a valid config: a loading page is displayed until then, and
 * an error page when the config cannot be loaded or is not valid.
 */
export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: config, status } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const response = await fetch(configJsonUrl)
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`)
      }
      const rawConfig = await response.json()
      return parseFrontConfig(rawConfig, document.baseURI)
    },
    staleTime: Infinity,
    retry: false
  })

  if (!config) {
    return <PageLayout>{status === 'error' ? <ErrorLayout /> : <LoadingLayout />}</PageLayout>
  }

  return <ConfigContext.Provider value={{ config }}>{children}</ConfigContext.Provider>
}

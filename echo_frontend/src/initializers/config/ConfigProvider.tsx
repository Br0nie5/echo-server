import { Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query'

import { parseFrontConfig } from '../../shared/config/utils/parseFrontConfig'
import { ErrorLayout } from '../../shared/layouts/ErrorLayout'
import { LoadingLayout } from '../../shared/layouts/LoadingLayout'
import { PageLayout } from '../../shared/layouts/PageLayout'

import { ConfigContext } from './ConfigContext'

export const configPageTestId = 'config-page-layout-test-id'
/** The URL of the `env.<mode>.json` file the config is parsed from. The file is generated at container start, so one build fits any deployment. */
export const configJsonBaseUrl = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/env.${import.meta.env.MODE}.json`

/** Loads and validates the runtime config once, showing a loading or error page meanwhile. Children are only rendered with a valid config. */
export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: config, status } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const response = await fetch(configJsonBaseUrl)
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`)
      }
      const rawConfig = await response.json()
      return parseFrontConfig(rawConfig)
    },
    staleTime: Infinity, // never refetch
    retry: false
  })

  if (!config) {
    return (
      <Box data-testid={configPageTestId}>
        <PageLayout>{status === 'error' ? <ErrorLayout /> : <LoadingLayout />}</PageLayout>
      </Box>
    )
  }

  return <ConfigContext.Provider value={{ config }}>{children}</ConfigContext.Provider>
}

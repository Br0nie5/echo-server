import { parseEchoEnv } from '@echo/utilities'
import { Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query'

import { ErrorLayout } from '../../shared/layouts/ErrorLayout'
import { LoadingLayout } from '../../shared/layouts/LoadingLayout'
import { PageLayout } from '../../shared/layouts/PageLayout'

import { EnvContext } from './EnvContext'

export const envPageTestId = 'env-page-layout-test-id'
/** Where the runtime env is served from. The file is generated at container start, so one build fits any deployment. */
export const envJsonBaseUrl = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/env.${import.meta.env.MODE}.json`

/** Loads and validates the runtime env once, showing a loading or error page meanwhile. Children are only rendered with a valid env. */
export const EnvProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: env, status } = useQuery({
    queryKey: ['env'],
    queryFn: async () => {
      const response = await fetch(envJsonBaseUrl)
      if (!response.ok) {
        throw new Error(`Failed to load env: ${response.status}`)
      }
      const rawEnv = await response.json()
      return parseEchoEnv(rawEnv)
    },
    staleTime: Infinity, // never refetch
    retry: false
  })

  if (!env) {
    return (
      <Box data-testid={envPageTestId}>
        <PageLayout>{status === 'error' ? <ErrorLayout /> : <LoadingLayout />}</PageLayout>
      </Box>
    )
  }

  return <EnvContext.Provider value={{ env }}>{children}</EnvContext.Provider>
}

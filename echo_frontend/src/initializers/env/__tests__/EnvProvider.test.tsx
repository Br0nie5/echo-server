import { Box } from '@mui/material'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, waitForElementToBeRemoved } from '@testing-library/react'
import nock from 'nock'

import i18n from '../../../shared/i18n/i18n.ts'
import type { AppTranslation } from '../../../shared/i18n/useAppTranslation.ts'
import { testEnv } from '../../../test/utils/env.ts'
import { testUrl } from '../../../test/utils/url.ts'
import { queryClient } from '../../api/queryClient.ts'
import { envJsonBaseUrl, envPageTestId, EnvProvider } from '../EnvProvider'

const appTranslation: AppTranslation = (key) => i18n.t(key)

describe('EnvProvider', () => {
  test('Should render its children correctly if the env is loaded', async () => {
    nock(testUrl).get(envJsonBaseUrl).reply(200, testEnv)

    const component = render(
      <QueryClientProvider client={queryClient}>
        <EnvProvider>
          <Box />
        </EnvProvider>
      </QueryClientProvider>
    )

    await waitForElementToBeRemoved(component.getByTestId(envPageTestId))

    expect(component.queryByTestId(envPageTestId)).not.toBeInTheDocument()
  })

  test('Should render a loader if the env failed loading', async () => {
    nock(testUrl).get(envJsonBaseUrl).reply(400, {})

    const component = render(
      <QueryClientProvider client={queryClient}>
        <EnvProvider>
          <Box />
        </EnvProvider>
      </QueryClientProvider>
    )

    expect(component.getByTestId(envPageTestId)).toBeInTheDocument()

    expect(await component.findByText(appTranslation('query.error'))).toBeInTheDocument()
  })
})

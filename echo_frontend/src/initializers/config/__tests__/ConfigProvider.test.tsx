import { Box } from '@mui/material'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, waitForElementToBeRemoved } from '@testing-library/react'
import nock from 'nock'

import i18n from '../../../shared/i18n/i18n.ts'
import type { AppTranslation } from '../../../shared/i18n/useAppTranslation.ts'
import { testConfig } from '../../../test/utils/config.ts'
import { testUrl } from '../../../test/utils/url.ts'
import { queryClient } from '../../api/queryClient.ts'
import { configJsonBaseUrl, configPageTestId, ConfigProvider } from '../ConfigProvider'

const appTranslation: AppTranslation = (key) => i18n.t(key)

describe('ConfigProvider', () => {
  test('Should render its children correctly if the config is loaded', async () => {
    nock(testUrl).get(configJsonBaseUrl).reply(200, testConfig)

    const component = render(
      <QueryClientProvider client={queryClient}>
        <ConfigProvider>
          <Box />
        </ConfigProvider>
      </QueryClientProvider>
    )

    await waitForElementToBeRemoved(component.getByTestId(configPageTestId))

    expect(component.queryByTestId(configPageTestId)).not.toBeInTheDocument()
  })

  test('Should render a loader if the config failed loading', async () => {
    nock(testUrl).get(configJsonBaseUrl).reply(400, {})

    const component = render(
      <QueryClientProvider client={queryClient}>
        <ConfigProvider>
          <Box />
        </ConfigProvider>
      </QueryClientProvider>
    )

    expect(component.getByTestId(configPageTestId)).toBeInTheDocument()

    expect(await component.findByText(appTranslation('query.error'))).toBeInTheDocument()
  })
})
